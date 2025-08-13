package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.dto.EcritureComptableDto;
import com.yowyob.erp.accounting.dto.PeriodeComptableDto;
import com.yowyob.erp.accounting.entity.*;
import com.yowyob.erp.accounting.entityKey.DetailEcritureKey;
import com.yowyob.erp.accounting.entityKey.EcritureComptableKey;
import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.accounting.repository.*;
import com.yowyob.erp.common.exception.ResourceNotFoundException;
import com.yowyob.erp.config.tenant.TenantContext;
import com.yowyob.erp.config.kafka.KafkaMessageService;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EcritureComptableService {

    private static final Logger logger = LoggerFactory.getLogger(EcritureComptableService.class);
    private final EcritureComptableRepository ecritureRepository;
    private final OperationComptableRepository operationComptableRepository;
    private final TransactionRepository transactionRepository;
    private final DetailEcritureService detailEcritureService;
    private final PlanComptableRepository planComptableRepository;
    private final JournalComptableService journalComptableService;
    private final PeriodeComptableService periodeComptableService;
    private final JournalAuditRepository journalAuditRepository;
    private final Validator validator;
    private final KafkaMessageService kafkaMessageService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public EcritureComptableService(EcritureComptableRepository ecritureRepository,
                                    OperationComptableRepository operationComptableRepository,
                                    TransactionRepository transactionRepository,
                                    DetailEcritureService detailEcritureService,
                                    PlanComptableRepository planComptableRepository,
                                    JournalComptableService journalComptableService,
                                    PeriodeComptableService periodeComptableService,
                                    JournalAuditRepository journalAuditRepository,
                                    Validator validator,
                                    KafkaMessageService kafkaMessageService,
                                    KafkaTemplate<String, Object> kafkaTemplate) {
        this.ecritureRepository = ecritureRepository;
        this.operationComptableRepository = operationComptableRepository;
        this.transactionRepository = transactionRepository;
        this.detailEcritureService = detailEcritureService;
        this.planComptableRepository = planComptableRepository;
        this.journalComptableService = journalComptableService;
        this.periodeComptableService = periodeComptableService;
        this.journalAuditRepository = journalAuditRepository;
        this.validator = validator;
        this.kafkaMessageService = kafkaMessageService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public EcritureComptableDto createEcriture(EcritureComptableDto ecritureDto) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        logger.info("Creating ecriture comptable for tenant: {}, numero: {}", tenantId, ecritureDto.getNumeroEcriture());

        validateEcritureDto(ecritureDto);
        journalComptableService.getJournalComptable(ecritureDto.getJournalComptableId())
                .filter(JournalComptable::getActif)
                .orElseThrow(() -> new IllegalArgumentException("Journal comptable invalide ou inactif : " + ecritureDto.getJournalComptableId()));
        periodeComptableService.getPeriodeComptable(ecritureDto.getPeriodeComptableId())
                .filter(p -> !p.getCloturee())
                .orElseThrow(() -> new IllegalArgumentException("Période comptable invalide ou clôturée : " + ecritureDto.getPeriodeComptableId()));

        EcritureComptable ecriture = mapToEntity(ecritureDto, tenantId);
        EcritureComptableKey key = new EcritureComptableKey();
        key.setTenantId(tenantId);
        key.setId(UUID.randomUUID());
        ecriture.setKey(key);
        ecriture.setCreatedAt(LocalDateTime.now());
        ecriture.setUpdatedAt(LocalDateTime.now());
        ecriture.setCreatedBy(currentUser != null ? currentUser : "system");
        ecriture.setUpdatedBy(currentUser != null ? currentUser : "system");

        EcritureComptable saved = ecritureRepository.save(ecriture);
        logAudit(tenantId, key.getId(), currentUser, "CREATE", "Created ecriture: " + ecritureDto.getNumeroEcriture());
        kafkaMessageService.sendMessage("accounting.entries", tenantId.toString(), "Ecriture created: " + saved.getKey().getId());
        return mapToDto(saved);
    }

    @Transactional
    public EcritureComptableDto validateEcriture(UUID id, String user) {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Validating ecriture comptable for tenant: {}, id: {}", tenantId, id);

        EcritureComptable ecriture = ecritureRepository.findByKeyTenantIdAndKeyId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Ecriture comptable", id.toString()));

        if (ecriture.getValidee()) {
            throw new IllegalStateException("Ecriture comptable already validated");
        }

        periodeComptableService.getPeriodeComptable(ecriture.getPeriodeComptableId())
                .filter(p -> !p.getCloturee())
                .orElseThrow(() -> new IllegalStateException("Période comptable clôturée : " + ecriture.getPeriodeComptableId()));

        List<DetailEcriture> details = detailEcritureService.findByKeyTenantIdAndKeyEcritureComptableId(tenantId, id);
        double totalDebit = details.stream().mapToDouble(DetailEcriture::getMontantDebit).sum();
        double totalCredit = details.stream().mapToDouble(DetailEcriture::getMontantCredit).sum();
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new IllegalStateException("Ecriture comptable unbalanced: debit=" + totalDebit + ", credit=" + totalCredit);
        }

        ecriture.setValidee(true);
        ecriture.setDateValidation(LocalDateTime.now());
        ecriture.setUtilisateurValidation(user);
        ecriture.setUpdatedAt(LocalDateTime.now());
        ecriture.setUpdatedBy(user != null ? user : "system");

        EcritureComptable validated = ecritureRepository.save(ecriture);
        logAudit(tenantId, id, user, "VALIDATE", "Validated ecriture: " + validated.getNumeroEcriture());
        kafkaMessageService.sendMessage("accounting.entries", tenantId.toString(), "Ecriture validated: " + validated.getKey().getId());
        return mapToDto(validated);
    }

    public Page<EcritureComptableDto> getAllEcritures(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Fetching all ecritures comptables for tenant: {}", tenantId);

        List<EcritureComptable> ecritures = ecritureRepository.findByKeyTenantId(tenantId);
        List<EcritureComptableDto> dtos = ecritures.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtos.size());
        List<EcritureComptableDto> pagedDtos = dtos.subList(start, end);
        return new PageImpl<>(pagedDtos, pageable, dtos.size());
    }

    public List<EcritureComptableDto> getNonValidatedEcritures() {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Fetching non-validated ecritures comptables for tenant: {}", tenantId);
        return ecritureRepository.findByKeyTenantIdAndValideeFalse(tenantId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<EcritureComptableDto> searchEcritures(LocalDateTime startDate, LocalDateTime endDate, UUID journalId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Searching ecritures comptables for tenant: {}, startDate: {}, endDate: {}, journalId: {}", tenantId, startDate, endDate, journalId);

        if (journalId != null) {
            journalComptableService.getJournalComptable(journalId)
                    .filter(JournalComptable::getActif)
                    .orElseThrow(() -> new IllegalArgumentException("Journal comptable invalide ou inactif : " + journalId));
        }

        List<EcritureComptable> ecritures;
        if (journalId != null) {
            ecritures = ecritureRepository.findByKeyTenantIdAndJournalComptableIdAndDateEcritureRange(tenantId, journalId, startDate, endDate);
        } else {
            ecritures = ecritureRepository.findByKeyTenantIdAndDateEcritureRange(tenantId, startDate, endDate);
        }
        return ecritures.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public EcritureComptableDto generateAutomaticEntry(UUID transactionId, UUID operationId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        logger.info("Generating automatic ecriture for tenant: {}, transactionId: {}, operationId: {}", tenantId, transactionId, operationId);

        Transaction transaction = transactionRepository.findByKeyTenantIdAndKeyId(tenantId, transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", transactionId.toString()));
        OperationComptable operation = operationComptableRepository.findByKeyTenantIdAndKeyId(tenantId, operationId)
                .orElseThrow(() -> new ResourceNotFoundException("Operation comptable", operationId.toString()));

        journalComptableService.getJournalComptable(operation.getJournalComptableId())
                .filter(JournalComptable::getActif)
                .orElseThrow(() -> new IllegalArgumentException("Journal comptable invalide ou inactif : " + operation.getJournalComptableId()));

        UUID periodeComptableId = getCurrentPeriodeComptableId(tenantId);
        periodeComptableService.getPeriodeComptable(periodeComptableId)
                .filter(p -> !p.getCloturee())
                .orElseThrow(() -> new IllegalStateException("Période comptable clôturée : " + periodeComptableId));

        EcritureComptable ecriture = new EcritureComptable();
        EcritureComptableKey key = new EcritureComptableKey();
        key.setTenantId(tenantId);
        key.setId(UUID.randomUUID());
        ecriture.setKey(key);
        ecriture.setNumeroEcriture("ECR-" + transactionId + "-" + System.currentTimeMillis());
        ecriture.setLibelle("Ecriture auto pour transaction: " + transaction.getNumeroRecu() + ", operation: " + operation.getTypeOperation());
        ecriture.setDateEcriture(LocalDate.now());
        ecriture.setJournalComptableId(operation.getJournalComptableId());
        ecriture.setPeriodeComptableId(periodeComptableId);
        ecriture.setMontantTotal(transaction.getMontantTransaction());
        ecriture.setValidee(false);
        ecriture.setCreatedAt(LocalDateTime.now());
        ecriture.setUpdatedAt(LocalDateTime.now());
        ecriture.setCreatedBy(currentUser != null ? currentUser : "system");
        ecriture.setUpdatedBy(currentUser != null ? currentUser : "system");

        EcritureComptable saved = ecritureRepository.save(ecriture);
        generateDetailsForEcriture(saved, operation, transaction);
        logAudit(tenantId, key.getId(), currentUser, "CREATE", "Generated automatic ecriture: " + ecriture.getNumeroEcriture());
        kafkaMessageService.sendMessage("accounting.entries", tenantId.toString(), "Automatic ecriture generated: " + saved.getKey().getId());
        return mapToDto(saved);
    }

    private void generateDetailsForEcriture(EcritureComptable ecriture, OperationComptable operation, Transaction transaction) {
        UUID tenantId = ecriture.getKey().getTenantId();
        UUID ecritureComptableId = ecriture.getKey().getId();
        String currentUser = TenantContext.getCurrentUser();

        PlanComptable principalAccount = planComptableRepository.findByKeyTenantIdAndNoCompte(tenantId, operation.getComptePrincipal())
                .filter(PlanComptable::getActif)
                .orElseThrow(() -> new ResourceNotFoundException("Compte", operation.getComptePrincipal()));
        PlanComptable counterAccount = planComptableRepository.findByKeyTenantIdAndNoCompte(tenantId, operation.getEstCompteStatique() ? "445710" : "411000")
                .filter(PlanComptable::getActif)
                .orElseThrow(() -> new ResourceNotFoundException("Compte", operation.getEstCompteStatique() ? "445710" : "411000"));

        DetailEcriture debitEntry = new DetailEcriture();
        DetailEcritureKey debitKey = new DetailEcritureKey();
        debitKey.setTenantId(tenantId);
        debitKey.setEcritureComptableId(ecritureComptableId);
        debitKey.setId(UUID.randomUUID());
        debitEntry.setKey(debitKey);
        debitEntry.setPlanComptableId(operation.getSensPrincipal().equals("DEBIT") ? principalAccount.getKey().getId() : counterAccount.getKey().getId());
        debitEntry.setLibelle("Transaction " + transaction.getNumeroRecu() + ", operation: " + operation.getTypeOperation());
        debitEntry.setSens("DEBIT");
        debitEntry.setMontantDebit(transaction.getMontantTransaction());
        debitEntry.setMontantCredit(0.0);
        debitEntry.setDateEcriture(LocalDateTime.now());
        debitEntry.setCreatedAt(LocalDateTime.now());
        debitEntry.setUpdatedAt(LocalDateTime.now());
        debitEntry.setCreatedBy(currentUser != null ? currentUser : "system");
        debitEntry.setUpdatedBy(currentUser != null ? currentUser : "system");

        DetailEcriture creditEntry = new DetailEcriture();
        DetailEcritureKey creditKey = new DetailEcritureKey();
        creditKey.setTenantId(tenantId);
        creditKey.setEcritureComptableId(ecritureComptableId);
        creditKey.setId(UUID.randomUUID());
        creditEntry.setKey(creditKey);
        creditEntry.setPlanComptableId(operation.getSensPrincipal().equals("CREDIT") ? principalAccount.getKey().getId() : counterAccount.getKey().getId());
        creditEntry.setLibelle("Transaction " + transaction.getNumeroRecu() + ", operation: " + operation.getTypeOperation());
        creditEntry.setSens("CREDIT");
        creditEntry.setMontantCredit(transaction.getMontantTransaction());
        creditEntry.setMontantDebit(0.0);
        creditEntry.setDateEcriture(LocalDateTime.now());
        creditEntry.setCreatedAt(LocalDateTime.now());
        creditEntry.setUpdatedAt(LocalDateTime.now());
        creditEntry.setCreatedBy(currentUser != null ? currentUser : "system");
        creditEntry.setUpdatedBy(currentUser != null ? currentUser : "system");

        detailEcritureService.createDetailEcriture(debitEntry);
        detailEcritureService.createDetailEcriture(creditEntry);
    }

    private void validateEcritureDto(EcritureComptableDto dto) {
        var violations = validator.validate(dto);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        if (dto.getNumeroEcriture() == null || !dto.getNumeroEcriture().matches("^ECR-[0-9a-f-]+-\\d+$")) {
            throw new IllegalArgumentException("Numéro d'écriture invalide, doit suivre le format ECR-<UUID>-<timestamp>");
        }
    }

    private EcritureComptable mapToEntity(EcritureComptableDto dto, UUID tenantId) {
        EcritureComptable ecriture = new EcritureComptable();
        ecriture.setTenantId(tenantId);
        ecriture.setNumeroEcriture(dto.getNumeroEcriture());
        ecriture.setLibelle(dto.getLibelle());
        ecriture.setDateEcriture(dto.getDateEcriture());
        ecriture.setJournalComptableId(dto.getJournalComptableId());
        ecriture.setPeriodeComptableId(dto.getPeriodeComptableId());
        ecriture.setMontantTotal(dto.getMontantTotal());
        ecriture.setValidee(dto.getValidee());
        ecriture.setDateValidation(dto.getDateValidation());
        ecriture.setUtilisateurValidation(dto.getUtilisateurValidation());
        ecriture.setReferenceExterne(dto.getReferenceExterne());
        ecriture.setNotes(dto.getNotes());
        return ecriture;
    }

    private EcritureComptableDto mapToDto(EcritureComptable ecriture) {
        return EcritureComptableDto.builder()
                .id(ecriture.getKey().getId())
                .numeroEcriture(ecriture.getNumeroEcriture())
                .libelle(ecriture.getLibelle())
                .dateEcriture(ecriture.getDateEcriture())
                .journalComptableId(ecriture.getJournalComptableId())
                .periodeComptableId(ecriture.getPeriodeComptableId())
                .montantTotal(ecriture.getMontantTotal())
                .validee(ecriture.getValidee())
                .dateValidation(ecriture.getDateValidation())
                .utilisateurValidation(ecriture.getUtilisateurValidation())
                .referenceExterne(ecriture.getReferenceExterne())
                .notes(ecriture.getNotes())
                .createdAt(ecriture.getCreatedAt())
                .updatedAt(ecriture.getUpdatedAt())
                .build();
    }

    private void logAudit(UUID tenantId, UUID ecritureComptableId, String utilisateur, String action, String details) {
        JournalAudit audit = new JournalAudit();
        JournalAuditKey auditKey = new JournalAuditKey();
        auditKey.setTenantId(tenantId);
        auditKey.setId(UUID.randomUUID());
        audit.setKey(auditKey);
        audit.setEcritureComptableId(ecritureComptableId);
        audit.setUtilisateur(utilisateur != null ? utilisateur : "system");
        audit.setAction(action);
        audit.setDetails(details);
        audit.setDateAction(LocalDateTime.now());
        journalAuditRepository.save(audit);
        kafkaTemplate.send("journal.audit.created", tenantId.toString(), audit);
    }

    private UUID getCurrentPeriodeComptableId(UUID tenantId) {
        return periodeComptableService.getPeriodeByDate(LocalDate.now())
                .map(PeriodeComptableDto::getId)
                .orElseThrow(() -> new IllegalStateException("Aucune période comptable ouverte pour la date actuelle"));
    }
}