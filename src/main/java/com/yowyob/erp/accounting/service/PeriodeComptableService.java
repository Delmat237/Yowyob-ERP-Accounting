package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.dto.PeriodeComptableDto;
import com.yowyob.erp.accounting.entity.JournalAudit;
import com.yowyob.erp.accounting.entity.PeriodeComptable;
import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.accounting.entityKey.PeriodeComptableKey;
import com.yowyob.erp.accounting.repository.JournalAuditRepository;
import com.yowyob.erp.accounting.repository.PeriodeComptableRepository;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PeriodeComptableService {

    private static final Logger logger = LoggerFactory.getLogger(PeriodeComptableService.class);
    private final PeriodeComptableRepository periodeComptableRepository;
    private final JournalAuditRepository journalAuditRepository;
    private final Validator validator;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PeriodeComptableService(PeriodeComptableRepository periodeComptableRepository,
                                   JournalAuditRepository journalAuditRepository,
                                   Validator validator,
                                   KafkaTemplate<String, Object> kafkaTemplate) {
        this.periodeComptableRepository = periodeComptableRepository;
        this.journalAuditRepository = journalAuditRepository;
        this.validator = validator;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public PeriodeComptableDto createPeriodeComptable(PeriodeComptableDto dto) {
        logger.info("Création d'une période comptable");
        validatePeriodeComptableDto(dto);
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        // Validate code uniqueness
        if (periodeComptableRepository.findByKeyTenantIdAndCode(tenantId, dto.getCode()).isPresent()) {
            throw new IllegalArgumentException("Une période comptable avec le code " + dto.getCode() + " existe déjà");
        }

        // Validate non-overlapping periods
        validateNonOverlappingPeriod(tenantId, dto.getDateDebut(), dto.getDateFin(), null);

        PeriodeComptable periode = mapToEntity(dto, tenantId);
        PeriodeComptableKey key = new PeriodeComptableKey();
        key.setTenantId(tenantId);
        key.setId(UUID.randomUUID());
        periode.setKey(key);
        periode.setCreatedAt(LocalDateTime.now());
        periode.setUpdatedAt(LocalDateTime.now());
        periode.setCreatedBy(currentUser != null ? currentUser : "system");
        periode.setUpdatedBy(currentUser != null ? currentUser : "system");

        PeriodeComptable savedPeriode = periodeComptableRepository.save(periode);
        PeriodeComptableDto savedDto = mapToDto(savedPeriode);
        logAudit(tenantId, null, currentUser, "CREATE", "Created periode: " + savedDto.getCode());
        kafkaTemplate.send("periode.comptable.created", tenantId.toString(), savedDto);
        logger.info("Période comptable créée avec succès : {}", savedPeriode.getKey().getId());
        return savedDto;
    }

    public Optional<PeriodeComptableDto> getPeriodeComptable(UUID periodeComptableId) {
        logger.info("Récupération de la période comptable avec l'ID : {}", periodeComptableId);
        validerAccesTenantId();
        return periodeComptableRepository.findByKeyTenantIdAndKeyId(TenantContext.getCurrentTenant(), periodeComptableId)
                .map(this::mapToDto);
    }

    public List<PeriodeComptableDto> getAllPeriodeComptables() {
        logger.info("Récupération de toutes les périodes comptables");
        validerAccesTenantId();
        return periodeComptableRepository.findByKeyTenantId(TenantContext.getCurrentTenant())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Optional<PeriodeComptableDto> getPeriodeByCode(String code) {
        logger.info("Récupération de la période comptable par code : {}", code);
        validerAccesTenantId();
        return periodeComptableRepository.findByKeyTenantIdAndCode(TenantContext.getCurrentTenant(), code)
                .map(this::mapToDto);
    }

    public Optional<PeriodeComptableDto> getPeriodeByDate(LocalDate date) {
        logger.info("Récupération de la période comptable pour la date : {}", date);
        validerAccesTenantId();
        return periodeComptableRepository.findByTenantIdAndDateInRange(TenantContext.getCurrentTenant(), date)
                .map(this::mapToDto);
    }

    public List<PeriodeComptableDto> getNonClosedPeriodes() {
        logger.info("Récupération des périodes comptables non clôturées");
        validerAccesTenantId();
        return periodeComptableRepository.findByKeyTenantIdAndClotureeFalse(TenantContext.getCurrentTenant())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PeriodeComptableDto> getPeriodesByRange(LocalDate startDate, LocalDate endDate) {
        logger.info("Récupération des périodes comptables entre {} et {}", startDate, endDate);
        validerAccesTenantId();
        return periodeComptableRepository.findByTenantIdAndPeriodRange(TenantContext.getCurrentTenant(), startDate, endDate)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PeriodeComptableDto updatePeriodeComptable(UUID periodeComptableId, PeriodeComptableDto dto) {
        logger.info("Mise à jour de la période comptable avec l'ID : {}", periodeComptableId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        PeriodeComptable existing = periodeComptableRepository.findByKeyTenantIdAndKeyId(tenantId, periodeComptableId)
                .orElseThrow(() -> new ResourceNotFoundException("Période comptable", periodeComptableId.toString()));

        if (existing.getCloturee()) {
            throw new IllegalStateException("Impossible de modifier une période comptable clôturée");
        }

        // Validate code uniqueness (if changed)
        if (!existing.getCode().equals(dto.getCode()) &&
                periodeComptableRepository.findByKeyTenantIdAndCode(tenantId, dto.getCode()).isPresent()) {
            throw new IllegalArgumentException("Une période comptable avec le code " + dto.getCode() + " existe déjà");
        }

        // Validate non-overlapping periods
        validateNonOverlappingPeriod(tenantId, dto.getDateDebut(), dto.getDateFin(), periodeComptableId);

        PeriodeComptable periode = mapToEntity(dto, tenantId);
        periode.setKey(new PeriodeComptableKey(tenantId, periodeComptableId));
        validatePeriodeComptableDto(dto);
        periode.setUpdatedAt(LocalDateTime.now());
        periode.setUpdatedBy(currentUser != null ? currentUser : "system");

        PeriodeComptable savedPeriode = periodeComptableRepository.save(periode);
        PeriodeComptableDto savedDto = mapToDto(savedPeriode);
        logAudit(tenantId, null, currentUser, "UPDATE", "Updated periode: " + savedDto.getCode());
        kafkaTemplate.send("periode.comptable.updated", tenantId.toString(), savedDto);
        logger.info("Période comptable mise à jour avec succès : {}", periodeComptableId);
        return savedDto;
    }

    @Transactional
    public PeriodeComptableDto closePeriodeComptable(UUID periodeComptableId) {
        logger.info("Clôture de la période comptable avec l'ID : {}", periodeComptableId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        PeriodeComptable periode = periodeComptableRepository.findByKeyTenantIdAndKeyId(tenantId, periodeComptableId)
                .orElseThrow(() -> new ResourceNotFoundException("Période comptable", periodeComptableId.toString()));

        if (periode.getCloturee()) {
            throw new IllegalStateException("Période comptable déjà clôturée");
        }

        periode.setCloturee(true);
        periode.setDateCloture(LocalDate.now());
        periode.setUpdatedAt(LocalDateTime.now());
        periode.setUpdatedBy(currentUser != null ? currentUser : "system");

        PeriodeComptable savedPeriode = periodeComptableRepository.save(periode);
        PeriodeComptableDto savedDto = mapToDto(savedPeriode);
        logAudit(tenantId, null, currentUser, "CLOSE", "Closed periode: " + savedDto.getCode());
        kafkaTemplate.send("periode.comptable.closed", tenantId.toString(), savedDto);
        logger.info("Période comptable clôturée avec succès : {}", periodeComptableId);
        return savedDto;
    }

    @Transactional
    public void deletePeriodeComptable(UUID periodeComptableId) {
        logger.info("Suppression de la période comptable avec l'ID : {}", periodeComptableId);
        validerAccesTenantId();
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();

        PeriodeComptable periode = periodeComptableRepository.findByKeyTenantIdAndKeyId(tenantId, periodeComptableId)
                .orElseThrow(() -> new ResourceNotFoundException("Période comptable", periodeComptableId.toString()));

        if (periode.getCloturee()) {
            throw new IllegalStateException("Impossible de supprimer une période comptable clôturée");
        }

        periodeComptableRepository.deleteById(new PeriodeComptableKey(tenantId, periodeComptableId));
        logAudit(tenantId, null, currentUser, "DELETE", "Deleted periode: " + periode.getCode());
        kafkaTemplate.send("periode.comptable.deleted", tenantId.toString(), periodeComptableId);
        logger.info("Période comptable supprimée avec succès : {}", periodeComptableId);
    }

    private void validatePeriodeComptableDto(PeriodeComptableDto dto) {
        var violations = validator.validate(dto);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        if (dto.getDateFin().isBefore(dto.getDateDebut())) {
            throw new IllegalArgumentException("La date de fin doit être postérieure à la date de début");
        }
    }

    private void validateNonOverlappingPeriod(UUID tenantId, LocalDate dateDebut, LocalDate dateFin, UUID excludeId) {
        List<PeriodeComptable> existingPeriods = periodeComptableRepository.findByKeyTenantId(tenantId);
        for (PeriodeComptable period : existingPeriods) {
            if (excludeId != null && period.getKey().getId().equals(excludeId)) {
                continue;
            }
            if (!(dateFin.isBefore(period.getDateDebut()) || dateDebut.isAfter(period.getDateFin()))) {
                throw new IllegalArgumentException("La période chevauche une période existante : " + period.getCode());
            }
        }
    }

    private PeriodeComptable mapToEntity(PeriodeComptableDto dto, UUID tenantId) {
        PeriodeComptable periode = new PeriodeComptable();
        periode.setTenantId(tenantId);
        periode.setCode(dto.getCode());
        periode.setDateDebut(dto.getDateDebut());
        periode.setDateFin(dto.getDateFin());
        periode.setCloturee(dto.getCloturee());
        periode.setDateCloture(dto.getDateCloture());
        periode.setNotes(dto.getNotes());
        return periode;
    }

    private PeriodeComptableDto mapToDto(PeriodeComptable periode) {
        return PeriodeComptableDto.builder()
                .id(periode.getKey().getId())
                .code(periode.getCode())
                .dateDebut(periode.getDateDebut())
                .dateFin(periode.getDateFin())
                .cloturee(periode.getCloturee())
                .dateCloture(periode.getDateCloture())
                .notes(periode.getNotes())
                .createdAt(periode.getCreatedAt())
                .updatedAt(periode.getUpdatedAt())
                .createdBy(periode.getCreatedBy())
                .updatedBy(periode.getUpdatedBy())
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