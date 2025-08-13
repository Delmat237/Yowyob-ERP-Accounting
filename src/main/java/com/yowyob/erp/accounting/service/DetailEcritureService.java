package com.yowyob.erp.accounting.service;

import com.yowyob.erp.config.tenant.TenantContext;
import com.yowyob.erp.accounting.entity.DetailEcriture;
import com.yowyob.erp.accounting.entity.JournalAudit;
import com.yowyob.erp.accounting.entity.PlanComptable;
import com.yowyob.erp.accounting.entityKey.DetailEcritureKey;
import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.accounting.entityKey.PlanComptableKey;
import com.yowyob.erp.accounting.repository.DetailEcritureRepository;
import com.yowyob.erp.accounting.repository.JournalAuditRepository;
import com.yowyob.erp.accounting.repository.PlanComptableRepository;
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
public class DetailEcritureService {

    private static final Logger logger = LoggerFactory.getLogger(DetailEcritureService.class);
    private final DetailEcritureRepository detailRepository;
    private final PlanComptableRepository planComptableRepository;
    private final JournalAuditRepository journalAuditRepository;
    private final Validator validator;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public DetailEcritureService(DetailEcritureRepository detailRepository, PlanComptableRepository planComptableRepository, JournalAuditRepository journalAuditRepository, Validator validator, KafkaTemplate<String, Object> kafkaTemplate) {
        this.detailRepository = detailRepository;
        this.planComptableRepository = planComptableRepository;
        this.journalAuditRepository = journalAuditRepository;
        this.validator = validator;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public DetailEcriture createDetailEcriture(DetailEcriture detail) {
        logger.info("Création d'un détail d'écriture");
        validerDetailEcriture(detail);
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        DetailEcritureKey key = new DetailEcritureKey();
        key.setTenantId(tenantId);
        key.setEcritureComptableId(detail.getKey().getEcritureComptableId());
        key.setId(UUID.randomUUID());
        detail.setKey(key);
        detail.setDateEcriture(LocalDateTime.now());
        detail.setCreatedAt(LocalDateTime.now());
        detail.setUpdatedAt(LocalDateTime.now());
        detail.setCreatedBy(currentUser != null ? currentUser : "system");
        detail.setUpdatedBy(currentUser != null ? currentUser : "system");

        if ("DEBIT".equals(detail.getSens())) {
            detail.setMontantCredit(0.0);
        } else if ("CREDIT".equals(detail.getSens())) {
            detail.setMontantDebit(0.0);
        }

        DetailEcriture savedDetail = detailRepository.save(detail);
        logAudit(tenantId, detail.getKey().getEcritureComptableId(), currentUser, "CREATE", "Created detail: " + savedDetail.getKey().getId());
        kafkaTemplate.send("detail.ecriture.created", tenantId.toString(), savedDetail);
        logger.info("Détail d'écriture créé avec succès : {}", savedDetail.getKey().getId());
        return savedDetail;
    }

    public Optional<DetailEcriture> getDetailEcriture(UUID detailId, UUID ecritureComptableId) {
        logger.info("Récupération du détail d'écriture avec l'ID : {}", detailId);
        validerAccesTenantId();
        DetailEcritureKey key = new DetailEcritureKey();
        key.setTenantId(TenantContext.getCurrentTenant());
        key.setEcritureComptableId(ecritureComptableId);
        key.setId(detailId);
        return detailRepository.findById(key);
    }

    public List<DetailEcriture> getAllDetailsEcriture() {
        logger.info("Récupération de tous les détails d'écriture pour le tenant");
        validerAccesTenantId();
        return detailRepository.findByKeyTenantId(TenantContext.getCurrentTenant());
    }

    public List<DetailEcriture> findByKeyTenantIdAndKeyEcritureComptableId(UUID tenantId, UUID ecritureComptableId) {
        logger.info("Récupération des détails d'écriture pour tenant: {}, ecritureComptableId: {}", tenantId, ecritureComptableId);
        validerAccesTenantId();
        return detailRepository.findByKeyTenantIdAndKeyEcritureComptableId(tenantId, ecritureComptableId);
    }

    @Transactional
    public DetailEcriture updateDetailEcriture(UUID detailId, UUID ecritureComptableId, DetailEcriture updatedDetail) {
        logger.info("Mise à jour du détail d'écriture avec l'ID : {}", detailId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        DetailEcritureKey key = new DetailEcritureKey();
        key.setTenantId(tenantId);
        key.setEcritureComptableId(ecritureComptableId);
        key.setId(detailId);
        if (!detailRepository.existsById(key)) {
            throw new IllegalArgumentException("L'ID du détail d'écriture n'existe pas : " + detailId);
        }
        updatedDetail.setKey(key);
        validerDetailEcriture(updatedDetail);
        updatedDetail.setUpdatedAt(LocalDateTime.now());
        updatedDetail.setUpdatedBy(currentUser != null ? currentUser : "system");

        if ("DEBIT".equals(updatedDetail.getSens())) {
            updatedDetail.setMontantCredit(0.0);
        } else if ("CREDIT".equals(updatedDetail.getSens())) {
            updatedDetail.setMontantDebit(0.0);
        }

        DetailEcriture savedDetail = detailRepository.save(updatedDetail);
        logAudit(tenantId, ecritureComptableId, currentUser, "UPDATE", "Updated detail: " + detailId);
        kafkaTemplate.send("detail.ecriture.updated", tenantId.toString(), savedDetail);
        logger.info("Détail d'écriture mis à jour avec succès : {}", detailId);
        return savedDetail;
    }

    @Transactional
    public void deleteDetailEcriture(UUID tenantId, UUID ecritureComptableId, UUID detailId) {
        logger.info("Suppression du détail d'écriture avec l'ID : {}", detailId);
        validerAccesTenantId();
        String currentUser = TenantContext.getCurrentUser();
        DetailEcritureKey key = new DetailEcritureKey();
        key.setTenantId(tenantId);
        key.setEcritureComptableId(ecritureComptableId);
        key.setId(detailId);
        if (!detailRepository.existsById(key)) {
            throw new IllegalArgumentException("L'ID du détail d'écriture n'existe pas : " + detailId);
        }
        detailRepository.deleteById(key);
        logAudit(tenantId, ecritureComptableId, currentUser, "DELETE", "Deleted detail: " + detailId);
        kafkaTemplate.send("detail.ecriture.deleted", tenantId.toString(), detailId);
        logger.info("Détail d'écriture supprimé avec succès : {}", detailId);
    }

    private void validerDetailEcriture(DetailEcriture detail) {
        var violations = validator.validate(detail);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        UUID tenantId = TenantContext.getCurrentTenant();
        PlanComptableKey planKey = new PlanComptableKey();
        planKey.setTenantId(tenantId);
        planKey.setId(detail.getPlanComptableId());
        PlanComptable plan = planComptableRepository.findByKey(planKey)
                .orElseThrow(() -> new IllegalArgumentException("Plan comptable ID invalide : " + detail.getPlanComptableId()));
        if (!plan.getActif()) {
            throw new IllegalArgumentException("Compte inactif : " + plan.getNoCompte());
        }
        if ("DEBIT".equals(detail.getSens()) && detail.getMontantDebit() <= 0) {
            throw new IllegalArgumentException("Montant débit doit être positif pour sens DEBIT");
        }
        if ("CREDIT".equals(detail.getSens()) && detail.getMontantCredit() <= 0) {
            throw new IllegalArgumentException("Montant crédit doit être positif pour sens CREDIT");
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