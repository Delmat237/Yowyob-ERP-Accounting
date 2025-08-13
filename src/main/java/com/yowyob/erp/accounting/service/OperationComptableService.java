package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.dto.OperationComptableDto;
import com.yowyob.erp.accounting.entity.JournalAudit;
import com.yowyob.erp.accounting.entity.JournalComptable;
import com.yowyob.erp.accounting.entity.OperationComptable;
import com.yowyob.erp.accounting.entity.PlanComptable;
import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.accounting.entityKey.OperationComptableKey;
import com.yowyob.erp.accounting.repository.JournalAuditRepository;
import com.yowyob.erp.accounting.repository.JournalComptableRepository;
import com.yowyob.erp.accounting.repository.OperationComptableRepository;
import com.yowyob.erp.accounting.repository.PlanComptableRepository;
import com.yowyob.erp.common.exception.ResourceNotFoundException;
import com.yowyob.erp.config.tenant.TenantContext;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OperationComptableService {

    private static final Logger logger = LoggerFactory.getLogger(OperationComptableService.class);
    private final OperationComptableRepository operationComptableRepository;
    private final JournalComptableRepository journalComptableRepository;
    private final PlanComptableRepository planComptableRepository;
    private final JournalAuditRepository journalAuditRepository;
    private final Validator validator;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OperationComptableService(OperationComptableRepository operationComptableRepository,
                                    JournalComptableRepository journalComptableRepository,
                                    PlanComptableRepository planComptableRepository,
                                    JournalAuditRepository journalAuditRepository,
                                    Validator validator,
                                    KafkaTemplate<String, Object> kafkaTemplate) {
        this.operationComptableRepository = operationComptableRepository;
        this.journalComptableRepository = journalComptableRepository;
        this.planComptableRepository = planComptableRepository;
        this.journalAuditRepository = journalAuditRepository;
        this.validator = validator;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public OperationComptableDto createOperationComptable(OperationComptableDto dto) {
        logger.info("Création d'une opération comptable");
        validateOperationComptableDto(dto);
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        // Validate journalComptableId
        journalComptableRepository.findByKeyTenantIdAndKeyId(tenantId, dto.getJournalComptableId())
                .filter(JournalComptable::getActif)
                .orElseThrow(() -> new IllegalArgumentException("Journal comptable invalide ou inactif : " + dto.getJournalComptableId()));

        // Validate comptePrincipal
        planComptableRepository.findByKeyTenantIdAndNoCompte(tenantId, dto.getComptePrincipal())
                .filter(PlanComptable::getActif)
                .orElseThrow(() -> new IllegalArgumentException("Compte principal invalide ou inactif : " + dto.getComptePrincipal()));

        // Check uniqueness of typeOperation and modeReglement
        if (operationComptableRepository.findByKeyTenantIdAndTypeOperationAndModeReglement(tenantId, dto.getTypeOperation(), dto.getModeReglement()).isPresent()) {
            throw new IllegalArgumentException("Opération avec type " + dto.getTypeOperation() + " et mode " + dto.getModeReglement() + " existe déjà");
        }

        OperationComptable operation = mapToEntity(dto, tenantId);
        OperationComptableKey key = new OperationComptableKey();
        key.setTenantId(tenantId);
        key.setId(UUID.randomUUID());
        operation.setKey(key);
        operation.setCreatedAt(LocalDateTime.now());
        operation.setUpdatedAt(LocalDateTime.now());
        operation.setCreatedBy(currentUser != null ? currentUser : "system");
        operation.setUpdatedBy(currentUser != null ? currentUser : "system");

        OperationComptable savedOperation = operationComptableRepository.save(operation);
        OperationComptableDto savedDto = mapToDto(savedOperation);
        logAudit(tenantId, null, currentUser, "CREATE", "Created operation: " + savedDto.getTypeOperation() + ", " + savedDto.getModeReglement());
        kafkaTemplate.send("operation.comptable.created", tenantId.toString(), savedDto);
        logger.info("Opération comptable créée avec succès : {}", savedOperation.getKey().getId());
        return savedDto;
    }

    public Optional<OperationComptableDto> getOperationComptable(UUID operationId) {
        logger.info("Récupération de l'opération comptable avec l'ID : {}", operationId);
        validerAccesTenantId();
        return operationComptableRepository.findByKeyTenantIdAndKeyId(TenantContext.getCurrentTenant(), operationId)
                .map(this::mapToDto);
    }

    public List<OperationComptableDto> getAllOperationsComptables() {
        logger.info("Récupération de toutes les opérations comptables pour le tenant");
        validerAccesTenantId();
        return operationComptableRepository.findByKeyTenantId(TenantContext.getCurrentTenant())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Optional<OperationComptableDto> getOperationByTypeAndMode(String typeOperation, String modeReglement) {
        logger.info("Récupération de l'opération comptable par type: {} et mode: {}", typeOperation, modeReglement);
        validerAccesTenantId();
        return operationComptableRepository.findByKeyTenantIdAndTypeOperationAndModeReglement(TenantContext.getCurrentTenant(), typeOperation, modeReglement)
                .map(this::mapToDto);
    }

    @Transactional
    public OperationComptableDto updateOperationComptable(UUID operationId, OperationComptableDto dto) {
        logger.info("Mise à jour de l'opération comptable avec l'ID : {}", operationId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        if (!operationComptableRepository.existsById(new OperationComptableKey(tenantId, operationId))) {
            throw new ResourceNotFoundException("Opération comptable", operationId.toString());
        }

        // Validate journalComptableId
        journalComptableRepository.findByKeyTenantIdAndKeyId(tenantId, dto.getJournalComptableId())
                .filter(JournalComptable::getActif)
                .orElseThrow(() -> new IllegalArgumentException("Journal comptable invalide ou inactif : " + dto.getJournalComptableId()));

        // Validate comptePrincipal
        planComptableRepository.findByKeyTenantIdAndNoCompte(tenantId, dto.getComptePrincipal())
                .filter(PlanComptable::getActif)
                .orElseThrow(() -> new IllegalArgumentException("Compte principal invalide ou inactif : " + dto.getComptePrincipal()));

        OperationComptable operation = mapToEntity(dto, tenantId);
        operation.setKey(new OperationComptableKey(tenantId, operationId));
        validateOperationComptableDto(dto);
        operation.setUpdatedAt(LocalDateTime.now());
        operation.setUpdatedBy(currentUser != null ? currentUser : "system");

        OperationComptable savedOperation = operationComptableRepository.save(operation);
        OperationComptableDto savedDto = mapToDto(savedOperation);
        logAudit(tenantId, null, currentUser, "UPDATE", "Updated operation: " + savedDto.getTypeOperation() + ", " + savedDto.getModeReglement());
        kafkaTemplate.send("operation.comptable.updated", tenantId.toString(), savedDto);
        logger.info("Opération comptable mise à jour avec succès : {}", operationId);
        return savedDto;
    }

    @Transactional
    public void deleteOperationComptable(UUID operationId) {
        logger.info("Suppression de l'opération comptable avec l'ID : {}", operationId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        OperationComptableKey key = new OperationComptableKey(tenantId, operationId);

        OperationComptable operation = operationComptableRepository.findByKeyTenantIdAndKeyId(tenantId, operationId)
                .orElseThrow(() -> new ResourceNotFoundException("Opération comptable", operationId.toString()));

        operationComptableRepository.deleteById(key);
        logAudit(tenantId, null, currentUser, "DELETE", "Deleted operation: " + operation.getTypeOperation() + ", " + operation.getModeReglement());
        kafkaTemplate.send("operation.comptable.deleted", tenantId.toString(), operationId);
        logger.info("Opération comptable supprimée avec succès : {}", operationId);
    }

    private void validateOperationComptableDto(OperationComptableDto dto) {
        var violations = validator.validate(dto);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
    }

    private OperationComptable mapToEntity(OperationComptableDto dto, UUID tenantId) {
        OperationComptable operation = new OperationComptable();
        operation.setTenantId(tenantId);
        operation.setTypeOperation(dto.getTypeOperation());
        operation.setModeReglement(dto.getModeReglement());
        operation.setComptePrincipal(dto.getComptePrincipal());
        operation.setEstCompteStatique(dto.getEstCompteStatique());
        operation.setSensPrincipal(dto.getSensPrincipal());
        operation.setJournalComptableId(dto.getJournalComptableId());
        operation.setTypeMontant(dto.getTypeMontant());
        operation.setPlafondClient(dto.getPlafondClient());
        operation.setActif(dto.getActif());
        operation.setNotes(dto.getNotes());
        return operation;
    }

    private OperationComptableDto mapToDto(OperationComptable operation) {
        return OperationComptableDto.builder()
                .id(operation.getKey().getId())
                .typeOperation(operation.getTypeOperation())
                .modeReglement(operation.getModeReglement())
                .comptePrincipal(operation.getComptePrincipal())
                .estCompteStatique(operation.getEstCompteStatique())
                .sensPrincipal(operation.getSensPrincipal())
                .journalComptableId(operation.getJournalComptableId())
                .typeMontant(operation.getTypeMontant())
                .plafondClient(operation.getPlafondClient())
                .actif(operation.getActif())
                .notes(operation.getNotes())
                .createdAt(operation.getCreatedAt())
                .updatedAt(operation.getUpdatedAt())
                .createdBy(operation.getCreatedBy())
                .updatedBy(operation.getUpdatedBy())
                .build();
    }

    private void validerAccesTenantId() {
        UUID currentTenantId = TenantContext.getCurrentTenant();
        if (currentTenantId == null) {
            throw new SecurityException("Accès refusé : ID du tenant non correspondant");
        }
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
}