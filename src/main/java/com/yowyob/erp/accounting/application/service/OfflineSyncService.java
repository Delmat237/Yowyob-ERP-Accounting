package com.yowyob.erp.accounting.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yowyob.erp.accounting.domain.port.in.*;
import com.yowyob.erp.accounting.infrastructure.web.dto.*;
import com.yowyob.erp.config.organization.ReactiveOrganizationContext;
import com.yowyob.erp.shared.application.service.IdempotentCreateSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OfflineSyncService {

    private final JournalComptableUseCase journalService;
    private final TaxeUseCase taxeService;
    private final DeviseUseCase deviseService;
    private final OperationComptableUseCase operationService;
    private final PlanComptableUseCase planService;
    private final PeriodeComptableUseCase periodeService;
    private final EcritureComptableUseCase ecritureService;
    private final IdempotentCreateSupport idempotentCreate;
    private final ObjectMapper objectMapper;

    public Mono<SyncPullResponseDto> pull(LocalDateTime since) {
        LocalDateTime effectiveSince = since != null ? since : LocalDateTime.MIN;
        return Mono.zip(
                journalService.getAllJournaux().defaultIfEmpty(List.of()),
                taxeService.getAllTaxes().defaultIfEmpty(List.of()),
                operationService.getAllOperations().defaultIfEmpty(List.of()),
                planService.getAllAccounts().defaultIfEmpty(List.of()),
                periodeService.getAllPeriodes().defaultIfEmpty(List.of()),
                ecritureService.getAll().defaultIfEmpty(List.of())
        ).map(tuple -> {
            Map<String, List<?>> changes = new HashMap<>();
            changes.put("cg.journaux", filterSince(tuple.getT1(), effectiveSince));
            changes.put("cg.taxes", filterSince(tuple.getT2(), effectiveSince));
            changes.put("cg.operations", filterSince(tuple.getT3(), effectiveSince));
            changes.put("cg.plan_comptable", filterSince(tuple.getT4(), effectiveSince));
            changes.put("cg.periodes", filterSince(tuple.getT5(), effectiveSince));
            changes.put("ecriture_comptable", filterSince(tuple.getT6(), effectiveSince));
            return SyncPullResponseDto.builder()
                    .serverTime(LocalDateTime.now())
                    .since(effectiveSince)
                    .changes(changes)
                    .build();
        });
    }

    public Mono<SyncPushResponseDto> push(SyncPushRequestDto request) {
        List<SyncPushRequestDto.SyncPushOperationDto> ops =
                request.getOperations() == null ? List.of() : request.getOperations();

        return Flux.fromIterable(ops)
                .concatMap(this::processOne)
                .collectList()
                .map(results -> {
                    int synced = 0;
                    int failed = 0;
                    int already = 0;
                    for (SyncPushResponseDto.SyncPushItemResultDto r : results) {
                        if ("ALREADY_PROCESSED".equals(r.getStatus())) already++;
                        else if ("OK".equals(r.getStatus()) || "CREATED".equals(r.getStatus())) synced++;
                        else failed++;
                    }
                    return SyncPushResponseDto.builder()
                            .results(results)
                            .synced(synced)
                            .failed(failed)
                            .alreadyProcessed(already)
                            .build();
                });
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> processOne(
            SyncPushRequestDto.SyncPushOperationDto op) {
        return ReactiveOrganizationContext.getOrganizationId()
                .flatMap(orgId -> dispatch(orgId, op))
                .onErrorResume(err -> {
                    log.warn("Sync push failed for {} {}: {}", op.getEntity(), op.getAction(), err.getMessage());
                    return Mono.just(SyncPushResponseDto.SyncPushItemResultDto.builder()
                            .clientMutationId(op.getClientMutationId())
                            .entityId(op.getEntityId())
                            .status("FAILED")
                            .message(err.getMessage())
                            .build());
                });
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> dispatch(
            UUID orgId, SyncPushRequestDto.SyncPushOperationDto op) {
        String entity = op.getEntity() != null ? op.getEntity() : "";
        String action = op.getAction() != null ? op.getAction() : "";

        if (!"CREATE".equals(action)) {
            return Mono.just(SyncPushResponseDto.SyncPushItemResultDto.builder()
                    .clientMutationId(op.getClientMutationId())
                    .entityId(op.getEntityId())
                    .status("SKIPPED")
                    .message("Batch push supports CREATE only; use individual endpoints for UPDATE/DELETE")
                    .build());
        }

        return switch (entity) {
            case "cg.journaux" -> createJournal(orgId, op);
            case "cg.taxes" -> createTaxe(orgId, op);
            case "cg.devises" -> createDevise(orgId, op);
            case "cg.operations" -> createOperation(orgId, op);
            case "cg.plan_comptable" -> createPlan(orgId, op);
            case "cg.periodes" -> createPeriode(orgId, op);
            default -> Mono.just(SyncPushResponseDto.SyncPushItemResultDto.builder()
                    .clientMutationId(op.getClientMutationId())
                    .entityId(op.getEntityId())
                    .status("SKIPPED")
                    .message("Entity not supported in batch: " + entity)
                    .build());
        };
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> createJournal(
            UUID orgId, SyncPushRequestDto.SyncPushOperationDto op) {
        JournalComptableDto dto = objectMapper.convertValue(op.getPayload(), JournalComptableDto.class);
        return idempotentCreate.create(orgId, op.getClientMutationId(), "journal_comptable",
                        journalService::getJournalComptable,
                        () -> journalService.createJournalComptable(dto),
                        JournalComptableDto::getId)
                .map(r -> toResult(op, r));
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> createTaxe(
            UUID orgId, SyncPushRequestDto.SyncPushOperationDto op) {
        TaxeDto dto = objectMapper.convertValue(op.getPayload(), TaxeDto.class);
        return idempotentCreate.create(orgId, op.getClientMutationId(), "taxe",
                        taxeService::getTaxe,
                        () -> taxeService.createTaxe(dto),
                        TaxeDto::getId)
                .map(r -> toResult(op, r));
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> createDevise(
            UUID orgId, SyncPushRequestDto.SyncPushOperationDto op) {
        DeviseDto dto = objectMapper.convertValue(op.getPayload(), DeviseDto.class);
        return idempotentCreate.create(orgId, op.getClientMutationId(), "devise",
                        deviseService::getDevise,
                        () -> deviseService.createDevise(dto),
                        DeviseDto::getId)
                .map(r -> toResult(op, r));
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> createOperation(
            UUID orgId, SyncPushRequestDto.SyncPushOperationDto op) {
        OperationComptableDto dto = objectMapper.convertValue(op.getPayload(), OperationComptableDto.class);
        return idempotentCreate.create(orgId, op.getClientMutationId(), "operation_comptable",
                        operationService::getOperation,
                        () -> operationService.createOperation(dto),
                        OperationComptableDto::getId)
                .map(r -> toResult(op, r));
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> createPlan(
            UUID orgId, SyncPushRequestDto.SyncPushOperationDto op) {
        PlanComptableDto dto = objectMapper.convertValue(op.getPayload(), PlanComptableDto.class);
        return idempotentCreate.create(orgId, op.getClientMutationId(), "plan_comptable",
                        planService::getAccountById,
                        () -> planService.createAccount(dto),
                        PlanComptableDto::getId)
                .map(r -> toResult(op, r));
    }

    private Mono<SyncPushResponseDto.SyncPushItemResultDto> createPeriode(
            UUID orgId, SyncPushRequestDto.SyncPushOperationDto op) {
        PeriodeComptableDto dto = objectMapper.convertValue(op.getPayload(), PeriodeComptableDto.class);
        return idempotentCreate.create(orgId, op.getClientMutationId(), "periode_comptable",
                        periodeService::getPeriode,
                        () -> periodeService.createPeriode(dto),
                        PeriodeComptableDto::getId)
                .map(r -> toResult(op, r));
    }

    private <T> SyncPushResponseDto.SyncPushItemResultDto toResult(
            SyncPushRequestDto.SyncPushOperationDto op, IdempotentCreateSupport.Result<T> r) {
        UUID id = null;
        try {
            Object rawId = r.data().getClass().getMethod("getId").invoke(r.data());
            if (rawId instanceof UUID uuid) id = uuid;
        } catch (Exception ignored) {
            // ignore
        }
        return SyncPushResponseDto.SyncPushItemResultDto.builder()
                .clientMutationId(op.getClientMutationId())
                .entityId(id != null ? id.toString() : op.getEntityId())
                .status(r.alreadyProcessed() ? "ALREADY_PROCESSED" : "CREATED")
                .data(r.data())
                .build();
    }

    private List<?> filterSince(List<?> items, LocalDateTime since) {
        if (items == null || items.isEmpty()) return List.of();
        if (since == null || since.equals(LocalDateTime.MIN)) return items;
        return items.stream().filter(item -> {
            LocalDateTime updated = extractUpdatedAt(item);
            return updated == null || !updated.isBefore(since);
        }).collect(Collectors.toList());
    }

    private LocalDateTime extractUpdatedAt(Object item) {
        try {
            Object v = item.getClass().getMethod("getUpdated_at").invoke(item);
            if (v instanceof LocalDateTime ldt) return ldt;
        } catch (Exception ignored) {
            // try camelCase
        }
        try {
            Object v = item.getClass().getMethod("getUpdatedAt").invoke(item);
            if (v instanceof LocalDateTime ldt) return ldt;
        } catch (Exception ignored) {
            // no updated field
        }
        return null;
    }
}
