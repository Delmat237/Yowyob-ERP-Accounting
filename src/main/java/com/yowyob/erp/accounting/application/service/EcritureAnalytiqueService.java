package com.yowyob.erp.accounting.application.service;

import com.yowyob.erp.accounting.domain.model.EcritureAnalytique;
import com.yowyob.erp.accounting.domain.model.LigneImputation;
import com.yowyob.erp.accounting.infrastructure.persistence.repository.*;
import com.yowyob.erp.accounting.infrastructure.web.dto.EcritureAnalytiqueDto;
import com.yowyob.erp.accounting.infrastructure.web.dto.LigneImputationDto;
import com.yowyob.erp.config.organization.ReactiveOrganizationContext;
import com.yowyob.erp.shared.domain.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EcritureAnalytiqueService {

    private final EcritureAnalytiqueRepository ecritureRepo;
    private final LigneImputationRepository ligneRepo;
    private final JournalAnalytiqueRepository journalRepo;
    private final PeriodeAnalytiqueRepository periodeRepo;
    private final AxeAnalytiqueRepository axeRepo;
    private final CompteAnalytiqueRepository compteAnalytiqueRepo;

    @Transactional
    public Mono<EcritureAnalytiqueDto> create(EcritureAnalytiqueDto dto) {
        return ReactiveOrganizationContext.getOrganizationId()
            .zipWith(ReactiveOrganizationContext.getCurrentUser().defaultIfEmpty("system"))
            .flatMap(t -> {
                UUID orgId = t.getT1(); String user = t.getT2();
                EcritureAnalytique entity = EcritureAnalytique.builder()
                    .id(UUID.randomUUID()).organizationId(orgId)
                    .journalId(dto.getJournalId()).periodeId(dto.getPeriodeId())
                    .numeroPiece(dto.getNumeroPiece()).libelle(dto.getLibelle())
                    .dateEffet(dto.getDateEffet())
                    .origine(dto.getOrigine() != null ? dto.getOrigine() : "MANUELLE")
                    .montantTotal(dto.getMontantTotal()).natureChargeId(dto.getNatureChargeId())
                    .ecriturecgRef(dto.getEcriturecgRef())
                    .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                    .createdBy(user).updatedBy(user).build();

                return ecritureRepo.save(entity)
                    .flatMap(saved -> saveLignes(saved.getId(), dto.getLignes())
                        .then(enrichDto(saved)));
            });
    }

    public Flux<EcritureAnalytiqueDto> getAll(String statut, UUID periodeId) {
        return ReactiveOrganizationContext.getOrganizationId()
            .flatMapMany(orgId -> {
                if (statut != null && periodeId != null)
                    return ecritureRepo.findByOrganizationIdAndStatutAndPeriodeId(orgId, statut, periodeId);
                if (statut != null)
                    return ecritureRepo.findByOrganizationIdAndStatut(orgId, statut);
                if (periodeId != null)
                    return ecritureRepo.findByOrganizationIdAndPeriodeId(orgId, periodeId);
                return ecritureRepo.findByOrganizationId(orgId);
            })
            .flatMap(this::enrichDto);
    }

    public Mono<EcritureAnalytiqueDto> findById(UUID id) {
        return ReactiveOrganizationContext.getOrganizationId()
            .flatMap(orgId -> ecritureRepo.findById(id)
                .filter(e -> orgId.equals(e.getOrganizationId()))
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("EcritureAnalytique", id.toString())))
                .flatMap(this::enrichDto));
    }

    @Transactional
    public Mono<EcritureAnalytiqueDto> valider(UUID id) {
        return ReactiveOrganizationContext.getOrganizationId()
            .zipWith(ReactiveOrganizationContext.getCurrentUser().defaultIfEmpty("system"))
            .flatMap(t -> {
                UUID orgId = t.getT1(); String user = t.getT2();
                return ecritureRepo.findById(id)
                    .filter(e -> orgId.equals(e.getOrganizationId()))
                    .switchIfEmpty(Mono.error(new ResourceNotFoundException("EcritureAnalytique", id.toString())))
                    .flatMap(e -> {
                        e.setStatut("VALIDEE");
                        e.setValidatedAt(LocalDateTime.now());
                        e.setValidatedBy(user);
                        e.setNotNew();
                        return ecritureRepo.save(e).flatMap(this::enrichDto);
                    });
            });
    }

    @Transactional
    public Mono<EcritureAnalytiqueDto> rejeter(UUID id, String raison) {
        return ReactiveOrganizationContext.getOrganizationId()
            .flatMap(orgId -> ecritureRepo.findById(id)
                .filter(e -> orgId.equals(e.getOrganizationId()))
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("EcritureAnalytique", id.toString())))
                .flatMap(e -> {
                    e.setStatut("REJETEE"); e.setRejectReason(raison); e.setNotNew();
                    return ecritureRepo.save(e).flatMap(this::enrichDto);
                }));
    }

    private Mono<Void> saveLignes(UUID ecritureId, List<LigneImputationDto> lignes) {
        if (lignes == null || lignes.isEmpty()) return Mono.empty();
        return Flux.fromIterable(lignes)
            .map(l -> LigneImputation.builder()
                .id(UUID.randomUUID()).ecritureId(ecritureId)
                .centreId(l.getCentreId()).uniteOeuvreId(l.getUniteOeuvreId())
                .montant(l.getMontant()).quantiteUo(l.getQuantiteUo())
                .sens(l.getSens() != null ? l.getSens() : "DEBIT")
                .libelle(l.getLibelle()).cleRepartitionId(l.getCleRepartitionId())
                .build())
            .flatMap(ligneRepo::save)
            .then();
    }

    public Mono<EcritureAnalytiqueDto> enrichForImport(EcritureAnalytique e) {
        return enrichDto(e);
    }

    private Mono<EcritureAnalytiqueDto> enrichDto(EcritureAnalytique e) {
        return ligneRepo.findByEcritureId(e.getId()).collectList()
            .flatMap(lignes -> {
                Mono<List<LigneImputationDto>> lignesDtoMono = Flux.fromIterable(lignes)
                    .flatMap(l -> {
                        Mono<String> centreLibelle = l.getCentreId() != null
                            ? axeRepo.findById(l.getCentreId()).map(a -> a.getCode() + " - " + a.getLibelle()).defaultIfEmpty("")
                            : Mono.just("");
                        return centreLibelle.map(cl -> LigneImputationDto.builder()
                            .id(l.getId()).ecritureId(l.getEcritureId())
                            .centreId(l.getCentreId()).centreLibelle(cl)
                            .uniteOeuvreId(l.getUniteOeuvreId()).montant(l.getMontant())
                            .quantiteUo(l.getQuantiteUo()).sens(l.getSens())
                            .libelle(l.getLibelle()).build());
                    }).collectList();

                return lignesDtoMono.map(ldtos -> EcritureAnalytiqueDto.builder()
                    .id(e.getId()).journalId(e.getJournalId()).periodeId(e.getPeriodeId())
                    .numeroPiece(e.getNumeroPiece()).libelle(e.getLibelle())
                    .dateEffet(e.getDateEffet()).origine(e.getOrigine()).statut(e.getStatut())
                    .ecriturecgRef(e.getEcriturecgRef()).montantTotal(e.getMontantTotal())
                    .natureChargeId(e.getNatureChargeId()).validatedAt(e.getValidatedAt())
                    .validatedBy(e.getValidatedBy()).rejectReason(e.getRejectReason())
                    .lignes(ldtos).build());
            });
    }
}
