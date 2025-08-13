package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.entity.JournalAudit;
import com.yowyob.erp.accounting.entity.JournalComptable;
import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.accounting.entityKey.JournalComptableKey;
import com.yowyob.erp.accounting.repository.JournalAuditRepository;
import com.yowyob.erp.accounting.repository.JournalComptableRepository;
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

@Service
public class JournalComptableService {

    private static final Logger logger = LoggerFactory.getLogger(JournalComptableService.class);
    private final JournalComptableRepository journalComptableRepository;
    private final JournalAuditRepository journalAuditRepository;
    private final Validator validator;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public JournalComptableService(JournalComptableRepository journalComptableRepository, JournalAuditRepository journalAuditRepository, Validator validator, KafkaTemplate<String, Object> kafkaTemplate) {
        this.journalComptableRepository = journalComptableRepository;
        this.journalAuditRepository = journalAuditRepository;
        this.validator = validator;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public JournalComptable createJournalComptable(JournalComptable journalComptable) {
        logger.info("Création d'un journal comptable");
        validerJournalComptable(journalComptable);
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        if (journalComptableRepository.existsByKeyTenantIdAndCodeJournal(tenantId, journalComptable.getCodeJournal())) {
            throw new IllegalArgumentException("Code journal déjà utilisé : " + journalComptable.getCodeJournal());
        }

        JournalComptableKey key = new JournalComptableKey();
        key.setTenantId(tenantId);
        key.setId(UUID.randomUUID());
        journalComptable.setKey(key);
        journalComptable.setCreatedAt(LocalDateTime.now());
        journalComptable.setUpdatedAt(LocalDateTime.now());
        journalComptable.setCreatedBy(currentUser != null ? currentUser : "system");
        journalComptable.setUpdatedBy(currentUser != null ? currentUser : "system");

        JournalComptable savedJournalComptable = journalComptableRepository.save(journalComptable);
        logAudit(tenantId, null, currentUser, "CREATE", "Created journal: " + journalComptable.getCodeJournal());
        kafkaTemplate.send("journal.comptable.created", tenantId.toString(), savedJournalComptable);
        logger.info("Journal comptable créé avec succès : {}", savedJournalComptable.getKey().getId());
        return savedJournalComptable;
    }

    public Optional<JournalComptable> getJournalComptable(UUID journalComptableId) {
        logger.info("Récupération du journal comptable avec l'ID : {}", journalComptableId);
        validerAccesTenantId();
        return journalComptableRepository.findByKeyTenantIdAndKeyId(TenantContext.getCurrentTenant(), journalComptableId);
    }

    public List<JournalComptable> getAllJournalComptables() {
        logger.info("Récupération de tous les journals comptables pour le tenant");
        validerAccesTenantId();
        return journalComptableRepository.findByKeyTenantId(TenantContext.getCurrentTenant());
    }

    public List<JournalComptable> getActiveJournalComptables() {
        logger.info("Récupération des journals comptables actifs pour le tenant");
        validerAccesTenantId();
        return journalComptableRepository.findByKeyTenantIdAndActifTrue(TenantContext.getCurrentTenant());
    }

    @Transactional
    public JournalComptable updateJournalComptable(UUID journalComptableId, JournalComptable updatedJournalComptable) {
        logger.info("Mise à jour du journal comptable avec l'ID : {}", journalComptableId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        if (!journalComptableRepository.existsByKeyTenantIdAndKeyId(tenantId, journalComptableId)) {
            throw new IllegalArgumentException("L'ID du journal comptable n'existe pas : " + journalComptableId);
        }
        updatedJournalComptable.setKey(new JournalComptableKey(tenantId, journalComptableId));
        validerJournalComptable(updatedJournalComptable);
        updatedJournalComptable.setUpdatedAt(LocalDateTime.now());
        updatedJournalComptable.setUpdatedBy(currentUser != null ? currentUser : "system");
        JournalComptable savedJournalComptable = journalComptableRepository.save(updatedJournalComptable);
        logAudit(tenantId, null, currentUser, "UPDATE", "Updated journal: " + updatedJournalComptable.getCodeJournal());
        kafkaTemplate.send("journal.comptable.updated", tenantId.toString(), savedJournalComptable);
        logger.info("Journal comptable mis à jour avec succès : {}", journalComptableId);
        return savedJournalComptable;
    }

    @Transactional
    public void deleteJournalComptable(UUID journalComptableId) {
        logger.info("Suppression du journal comptable avec l'ID : {}", journalComptableId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        JournalComptableKey key = new JournalComptableKey(tenantId, journalComptableId);
        if (!journalComptableRepository.existsByKeyTenantIdAndKeyId(tenantId, journalComptableId)) {
            throw new IllegalArgumentException("L'ID du journal comptable n'existe pas : " + journalComptableId);
        }
        journalComptableRepository.deleteById(key);
        logAudit(tenantId, null, currentUser, "DELETE", "Deleted journal ID: " + journalComptableId);
        kafkaTemplate.send("journal.comptable.deleted", tenantId.toString(), journalComptableId);
        logger.info("Journal comptable supprimé avec succès : {}", journalComptableId);
    }

    private void validerJournalComptable(JournalComptable journalComptable) {
        var violations = validator.validate(journalComptable);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        String codeJournal = journalComptable.getCodeJournal();
        if (!codeJournal.matches("^[A-Z]{1,5}$")) {
            throw new IllegalArgumentException("Code journal invalide, doit être 1-5 lettres majuscules : " + codeJournal);
        }
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