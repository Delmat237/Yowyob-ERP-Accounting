package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.dto.EcritureComptableDto;
import com.yowyob.erp.accounting.dto.PeriodeComptableDto;
import com.yowyob.erp.accounting.dto.DetailEcritureDto;
import com.yowyob.erp.accounting.dto.JournalComptableDto;
import com.yowyob.erp.accounting.entity.*;
import com.yowyob.erp.accounting.entityKey.DetailEcritureKey;
import com.yowyob.erp.accounting.entityKey.EcritureComptableKey;
import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.accounting.repository.*;
import com.yowyob.erp.common.entity.ComptableObject;
import com.yowyob.erp.common.exception.BusinessException;
import com.yowyob.erp.common.exception.ResourceNotFoundException;
import com.yowyob.erp.config.tenant.TenantContext;
import com.yowyob.erp.config.kafka.KafkaMessageService;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EcritureComptableService {

    private static final Logger logger = LoggerFactory.getLogger(EcritureComptableService.class);
    private static final String CACHE_ALL_ECRITURES = "ecritures:all:";
    private static final String CACHE_NON_VALIDATED_ECRITURES = "ecritures:nonvalidated:";
    private static final String CACHE_SEARCH_ECRITURES = "ecritures:search:";

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
    private final KafkaOperations<String, Object> kafkaOperations;
    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
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
                                    KafkaOperations<String, Object> kafkaOperations,
                                    RedisTemplate<String, Object> redisTemplate) {
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
        this.kafkaOperations = kafkaOperations;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public EcritureComptableDto createEcriture(EcritureComptableDto ecritureDto) {

        //Extraction de l'utilisateur et du Tenant
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        logger.info("Creating ecriture comptable for tenant: {}, numero: {}", tenantId, ecritureDto.getNumeroEcriture());

        //Validation de l'ecriture comptable
        validateEcritureDto(ecritureDto);

        //Recuperation du journal comptable 
        journalComptableService.getJournalComptable(ecritureDto.getJournalComptableId())
                .filter(JournalComptableDto::getActif)
                .orElseThrow(() -> new IllegalArgumentException("Journal comptable invalide ou inactif : " + ecritureDto.getJournalComptableId()));

        //Recuperation de l'exercice
        PeriodeComptableDto periode = periodeComptableService.getPeriodeComptable(ecritureDto.getPeriodeComptableId())
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
        // Validation des détails après sauvegarde
        List<DetailEcriture> details = detailEcritureService.findByKeyTenantIdAndKeyEcritureComptableId(tenantId, key.getId());
        validateBalance(details);

        logAuditAndSendKafka(tenantId, key.getId(), currentUser, "CREATE", "Created ecriture: " + ecritureDto.getNumeroEcriture());
        invalidateCaches(tenantId);
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

        PeriodeComptableDto periode = periodeComptableService.getPeriodeComptable(ecriture.getPeriodeComptableId())
                .filter(p -> !p.getCloturee())
                .orElseThrow(() -> new IllegalStateException("Période comptable clôturée : " + ecriture.getPeriodeComptableId()));

        List<DetailEcriture> details = detailEcritureService.findByKeyTenantIdAndKeyEcritureComptableId(tenantId, id);
        validateBalance(details);

        ecriture.setValidee(true);
        ecriture.setDateValidation(LocalDateTime.now());
        ecriture.setUtilisateurValidation(user);
        ecriture.setUpdatedAt(LocalDateTime.now());
        ecriture.setUpdatedBy(user != null ? user : "system");

        EcritureComptable validated = ecritureRepository.save(ecriture);
        logAuditAndSendKafka(tenantId, id, user, "VALIDATE", "Validated ecriture: " + validated.getNumeroEcriture());
        invalidateCaches(tenantId);
        return mapToDto(validated);
    }

    public List<EcritureComptableDto> getAllEcritures() {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Fetching all ecritures comptables for tenant: {}", tenantId);

        String cacheKey = CACHE_ALL_ECRITURES + tenantId;
        List<EcritureComptableDto> ecritures = null;

        try {
            ecritures = (List<EcritureComptableDto>) redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve ecritures from Redis for tenant {}: {}", tenantId, e.getMessage());
        }

        if (ecritures == null) {
            ecritures = ecritureRepository.findByKeyTenantId(tenantId)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            try {
                redisTemplate.opsForValue().set(cacheKey, ecritures, Duration.ofMinutes(10));
            } catch (Exception e) {
                logger.warn("Failed to cache ecritures in Redis for tenant {}: {}", tenantId, e.getMessage());
            }
        }
        return ecritures != null ? ecritures : List.of();
    }

    public Optional<EcritureComptableDto> getEcritureById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Fetching ecriture comptable by ID: {} for tenant: {}", id, tenantId);

        return ecritureRepository.findByKeyTenantIdAndKeyId(tenantId, id)
                .map(ecriture -> {
                    EcritureComptableDto dto = mapToDto(ecriture);
                    // Fetch and map associated DetailEcriture entries
                    List<DetailEcritureDto> details = detailEcritureService.findByKeyTenantIdAndKeyEcritureComptableId(tenantId, id)
                            .stream()
                            .map(this::mapToDetailEcritureDto)
                            .collect(Collectors.toList());
                    dto.setDetailsEcriture(details);
                    return dto;
                });
    }
    public List<EcritureComptableDto> getNonValidatedEcritures() {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Fetching non-validated ecritures comptables for tenant: {}", tenantId);

        String cacheKey = CACHE_NON_VALIDATED_ECRITURES + tenantId;
        List<EcritureComptableDto> ecritures = null;

        try {
            ecritures = (List<EcritureComptableDto>) redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve non-validated ecritures from Redis for tenant {}: {}", tenantId, e.getMessage());
        }

        if (ecritures == null) {
            ecritures = ecritureRepository.findByKeyTenantIdAndValideeFalse(tenantId)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            try {
                redisTemplate.opsForValue().set(cacheKey, ecritures, Duration.ofMinutes(10));
            } catch (Exception e) {
                logger.warn("Failed to cache non-validated ecritures in Redis for tenant {}: {}", tenantId, e.getMessage());
            }
        }
        return ecritures != null ? ecritures : List.of();
    }

    @Transactional
    public void deleteEcriture(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Optional<EcritureComptable> ecritureOpt = ecritureRepository.findByKeyTenantIdAndKeyId(tenantId, id);

        if (ecritureOpt.isEmpty()) {
            throw new BusinessException("Écriture non trouvée avec ID : " + id);
        }

        EcritureComptable ecriture = ecritureOpt.get();
        if (ecriture.getValidee()) {
            throw new BusinessException("Impossible de supprimer une écriture déjà validée");
        }

        ecritureRepository.delete(ecriture);
        logger.info("Écriture avec ID {} supprimée avec succès pour le tenant {}", id, tenantId);
    }
    
    @Transactional
    public EcritureComptableDto generateFromComptableObject(ComptableObject comptableObject) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        logger.info("Generating ecriture from comptable object for tenant: {}, type: {}, id: {}", 
                tenantId, comptableObject.getClass().getSimpleName(), comptableObject.getId());

        UUID periodeComptableId = getCurrentPeriodeComptableId(tenantId);
        periodeComptableService.getPeriodeComptable(periodeComptableId)
                .filter(p -> !p.getCloturee())
                .orElseThrow(() -> new IllegalStateException("Période comptable clôturée : " + periodeComptableId));

        EcritureComptable ecriture = new EcritureComptable();
        EcritureComptableKey key = new EcritureComptableKey();
        key.setTenantId(tenantId);
        key.setId(UUID.randomUUID());
        ecriture.setKey(key);
        ecriture.setNumeroEcriture("ECR-" + comptableObject.getId() + "-" + System.currentTimeMillis());
        ecriture.setLibelle(comptableObject.getLibelle());
        ecriture.setDateEcriture(comptableObject.getDate());
        ecriture.setJournalComptableId(comptableObject.getJournalComptableId());
        ecriture.setPeriodeComptableId(periodeComptableId);
        ecriture.setMontantTotalDebit(comptableObject.getMontant());
       // ecriture.setMontantTotalCredit(comptableObject.getMontant());
        ecriture.setValidee(false);
        ecriture.setSourceType(comptableObject.getSourceType());
        ecriture.setSourceId(comptableObject.getId());
        ecriture.setCreatedAt(LocalDateTime.now());
        ecriture.setUpdatedAt(LocalDateTime.now());
        ecriture.setCreatedBy(currentUser != null ? currentUser : "system");
        ecriture.setUpdatedBy(currentUser != null ? currentUser : "system");

        EcritureComptable saved = ecritureRepository.save(ecriture);
        List<DetailEcriture> details = comptableObject.generateEcritureDetails(tenantId, saved.getKey().getId());
        details.forEach(detailEcritureService::createDetailEcriture);
        validateBalance(details);

        logAuditAndSendKafka(tenantId, key.getId(), currentUser, "CREATE", 
                "Generated ecriture from " + comptableObject.getClass().getSimpleName() + ": " + ecriture.getNumeroEcriture());
        invalidateCaches(tenantId);
        return mapToDto(saved);
    }

    public List<EcritureComptableDto> searchEcritures(LocalDateTime startDate, LocalDateTime endDate, UUID journalId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        logger.info("Searching ecritures comptables for tenant: {}, startDate: {}, endDate: {}, journalId: {}", tenantId, startDate, endDate, journalId);

        if (journalId != null) {
            journalComptableService.getJournalComptable(journalId)
                    .filter(JournalComptableDto::getActif)
                    .orElseThrow(() -> new IllegalArgumentException("Journal comptable invalide ou inactif : " + journalId));
        }

        String cacheKey = CACHE_SEARCH_ECRITURES + tenantId + ":" + (journalId != null ? journalId : "") + ":" + startDate + ":" + endDate;
        List<EcritureComptableDto> ecritures = null;

        try {
            ecritures = (List<EcritureComptableDto>) redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve search ecritures from Redis for tenant {}: {}", tenantId, e.getMessage());
        }

        if (ecritures == null) {
            List<EcritureComptable> results;
            if (journalId != null) {
                results = ecritureRepository.findByKeyTenantIdAndJournalComptableIdAndDateEcritureRange(tenantId, journalId, startDate, endDate);
            } else {
                results = ecritureRepository.findByKeyTenantIdAndDateEcritureRange(tenantId, startDate, endDate);
            }
            ecritures = results.stream().map(this::mapToDto).collect(Collectors.toList());
            try {
                redisTemplate.opsForValue().set(cacheKey, ecritures, Duration.ofMinutes(10));
            } catch (Exception e) {
                logger.warn("Failed to cache search ecritures in Redis for tenant {}: {}", tenantId, e.getMessage());
            }
        }
        return ecritures;
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
                .filter(JournalComptableDto::getActif)
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
        ecriture.setMontantTotalDebit(transaction.getMontantTransaction());
        //A partir du sens de la transaction
       // ecriture.setMontantTotalDebit(transaction.getMontantTransaction());

        ecriture.setValidee(false);
        ecriture.setCreatedAt(LocalDateTime.now());
        ecriture.setUpdatedAt(LocalDateTime.now());
        ecriture.setCreatedBy(currentUser != null ? currentUser : "system");
        ecriture.setUpdatedBy(currentUser != null ? currentUser : "system");

        EcritureComptable saved = ecritureRepository.save(ecriture);
        generateDetailsForEcriture(saved, operation, transaction);
        List<DetailEcriture> details = detailEcritureService.findByKeyTenantIdAndKeyEcritureComptableId(tenantId, key.getId());
        validateBalance(details);

        logAuditAndSendKafka(tenantId, key.getId(), currentUser, "CREATE", "Generated automatic ecriture: " + ecriture.getNumeroEcriture());
        invalidateCaches(tenantId);
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
        debitEntry.setCompteComptableId(operation.getSensPrincipal().equals("DEBIT") ? principalAccount.getKey().getId() : counterAccount.getKey().getId());
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
        creditEntry.setCompteComptableId(operation.getSensPrincipal().equals("CREDIT") ? principalAccount.getKey().getId() : counterAccount.getKey().getId());
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
    
    }

    private EcritureComptable mapToEntity(EcritureComptableDto dto, UUID tenantId) {
        EcritureComptable ecriture = new EcritureComptable();
        ecriture.setTenantId(tenantId);
        ecriture.setNumeroEcriture(dto.getNumeroEcriture());
        ecriture.setLibelle(dto.getLibelle());
        ecriture.setDateEcriture(dto.getDateEcriture());
        ecriture.setJournalComptableId(dto.getJournalComptableId());
        ecriture.setPeriodeComptableId(dto.getPeriodeComptableId());
        ecriture.setMontantTotalDebit(dto.getMontantTotalDebit());
        ecriture.setMontantTotalCredit(dto.getMontantTotalCredit());
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
                .montantTotalDebit(ecriture.getMontantTotalDebit())
                .montantTotalCredit(ecriture.getMontantTotalCredit())
                .validee(ecriture.getValidee())
                .dateValidation(ecriture.getDateValidation())
                .utilisateurValidation(ecriture.getUtilisateurValidation())
                .referenceExterne(ecriture.getReferenceExterne())
                .notes(ecriture.getNotes())
                .createdAt(ecriture.getCreatedAt())
                .updatedAt(ecriture.getUpdatedAt())
                .build();
    }
    
    private DetailEcritureDto mapToDetailEcritureDto(DetailEcriture detail) {
        return DetailEcritureDto.builder()
                .id(detail.getKey().getId())
                .ecritureComptableId(detail.getKey().getEcritureComptableId())
                .compteComptableId(detail.getCompteComptableId())
                .libelle(detail.getLibelle())
                .sens(detail.getSens())
                .montantDebit(detail.getMontantDebit())
                .montantCredit(detail.getMontantCredit())
                .notes(detail.getNotes())
                .dateEcriture(detail.getDateEcriture())
                .build();
    }

    private void logAuditAndSendKafka(UUID tenantId, UUID ecritureComptableId, String utilisateur, String action, String details) {
        kafkaOperations.executeInTransaction(operations -> {
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
            kafkaMessageService.sendAuditLog(audit, tenantId.toString(), action);
            return null;
        });
    }

    private void validateBalance(List<DetailEcriture> details) {
        double totalDebit = details.stream().mapToDouble(DetailEcriture::getMontantDebit).sum();
        double totalCredit = details.stream().mapToDouble(DetailEcriture::getMontantCredit).sum();
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new IllegalStateException("Ecriture comptable unbalanced: debit=" + totalDebit + ", credit=" + totalCredit);
        }
    }

    private void invalidateCaches(UUID tenantId) {
        try {
            redisTemplate.delete(CACHE_ALL_ECRITURES + tenantId);
            redisTemplate.delete(CACHE_NON_VALIDATED_ECRITURES + tenantId);
        } catch (Exception e) {
            logger.warn("Failed to invalidate caches in Redis for tenant {}: {}", tenantId, e.getMessage());
        }
    }

    private UUID getCurrentPeriodeComptableId(UUID tenantId) {
        return periodeComptableService.getPeriodeByDate(LocalDate.now())
                .map(PeriodeComptableDto::getId)
                .orElseThrow(() -> new IllegalStateException("Aucune période comptable ouverte pour la date actuelle"));
    }
}