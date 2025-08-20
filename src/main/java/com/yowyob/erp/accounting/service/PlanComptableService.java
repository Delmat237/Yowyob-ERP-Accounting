package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.dto.PlanComptableDto;
import com.yowyob.erp.accounting.entity.PlanComptable;

import com.yowyob.erp.accounting.entityKey.PlanComptableKey;
import com.yowyob.erp.accounting.repository.PlanComptableRepository;
import com.yowyob.erp.common.exception.ResourceNotFoundException;
import com.yowyob.erp.common.exception.BusinessException;
import com.yowyob.erp.common.service.ValidationService;
import com.yowyob.erp.config.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanComptableService {

    private final PlanComptableRepository planComptableRepository;
    private final ValidationService validationService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public PlanComptableDto createAccount(PlanComptableDto dto) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        log.info("Creating account for tenant: {}, noCompte: {}", tenantId,dto.getNoCompte());

        // Validation du numéro de planComptable
        validationService.validateAccountNumber(dto.getNoCompte());

        // Vérification de l'unicité
        if (planComptableRepository.existsByKeyTenantIdAndNoCompte(tenantId,dto.getNoCompte())) {
            throw new BusinessException("Un Compte Comptable avec ce numéro existe déjà: " +dto.getNoCompte());
        }

       PlanComptable account = new PlanComptable();
       PlanComptableKey key = new PlanComptableKey();
        key.setTenantId(tenantId);
        key.setId(UUID.randomUUID());
        account.setKey(key);
        account.setNoCompte(dto.getNoCompte());
        account.setLibelle(dto.getLibelle());
        account.setNotes(dto.getNotes());
        account.setActif(true);
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());
        account.setCreatedBy(currentUser != null ? currentUser : "system");
        account.setUpdatedBy(currentUser != null ? currentUser : "system");

        PlanComptable saved = planComptableRepository.save(account);
        kafkaTemplate.send("plan.comptable.created", tenantId.toString(), mapToDto(saved));
        log.info("Compte Comptable créé: {} - {}", saved.getNoCompte(), saved.getLibelle());
        return mapToDto(saved);
    }

    public List<PlanComptableDto> getAllActiveAccounts() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return planComptableRepository.findByKeyTenantIdAndActifTrue(tenantId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    
    public PlanComptableDto getAccountById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
       PlanComptableKey key = new PlanComptableKey();
        key.setTenantId(tenantId);
        key.setId(id);

        PlanComptable account = planComptableRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Compte Comptable", id.toString()));
        return mapToDto(account);
    }

    
   public List<PlanComptableDto> getPlanComptablesByClasse(Integer classe) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return planComptableRepository.findByKeyTenantIdAndClasse(tenantId, classe)
                    .stream()   
                     .map(this::mapToDto)
                     .collect(Collectors.toList());
    }
    

    public List<PlanComptableDto> getAccountsByPrefix(String prefix) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return planComptableRepository.findByKeyTenantIdAndNoComptePrefix(tenantId, prefix)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlanComptableDto updateAccount(UUID id, PlanComptableDto dto) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        PlanComptableKey key = new PlanComptableKey();
        key.setTenantId(tenantId);
        key.setId(id);

        PlanComptable account = planComptableRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("PlanComptable", id.toString()));

        account.setLibelle(dto.getLibelle());
        account.setNotes(dto.getNotes());
        account.setUpdatedAt(LocalDateTime.now());
        account.setUpdatedBy(currentUser != null ? currentUser : "system");

        PlanComptable saved = planComptableRepository.save(account);
        kafkaTemplate.send("planComptable.updated", tenantId.toString(), mapToDto(saved));
        return mapToDto(saved);
    }

    @Transactional
    public void deactivateAccount(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String currentUser = TenantContext.getCurrentUser();
        PlanComptableKey key = new PlanComptableKey();
        key.setTenantId(tenantId);
        key.setId(id);

        PlanComptable account = planComptableRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("PlanComptable", id.toString()));

        account.setActif(false);
        account.setUpdatedAt(LocalDateTime.now());
        account.setUpdatedBy(currentUser != null ? currentUser : "system");
        planComptableRepository.save(account);

        kafkaTemplate.send("account.deactivated", tenantId.toString(), id);
        log.info("PlanComptable désactivé: {}", account.getNoCompte());
    }

    private PlanComptableDto mapToDto(PlanComptable account) {
        return PlanComptableDto.builder()
                .id(account.getKey().getId())
                .noCompte(account.getNoCompte())
                .libelle(account.getLibelle())
                .notes(account.getNotes())
                .actif(account.getActif())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }

}