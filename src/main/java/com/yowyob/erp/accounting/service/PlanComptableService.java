// Service pour le plan comptable
package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.dto.PlanComptableDto;
import com.yowyob.erp.accounting.entity.PlanComptable;
import com.yowyob.erp.accounting.repository.PlanComptableRepository;
import com.yowyob.erp.common.exception.ResourceNotFoundException;
import com.yowyob.erp.common.exception.BusinessException;
import com.yowyob.erp.common.service.ValidationService;
import com.yowyob.erp.config.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanComptableService {

    private final PlanComptableRepository planComptableRepository;
    private final ValidationService validationService;

    @Transactional
    public PlanComptableDto createAccount(PlanComptableDto dto) {
        String tenantId = TenantContext.getCurrentTenant();
        
        // Validation du numéro de compte
        validationService.validateAccountNumber(dto.getNoCompte());
        
        // Vérification de l'unicité
        if (planComptableRepository.existsByTenantIdAndNoCompte(tenantId, dto.getNoCompte())) {
            throw new BusinessException("Un compte avec ce numéro existe déjà");
        }
        
        PlanComptable account = new PlanComptable();
        account.setTenantId(tenantId);
        account.setNoCompte(dto.getNoCompte());
        account.setLibelle(dto.getLibelle());
        account.setNotes(dto.getNotes());
        account.setActif(true);
        
        account = planComptableRepository.save(account);
        
        log.info("Compte créé: {} - {}", account.getNoCompte(), account.getLibelle());
        
        return mapToDto(account);
    }

    public List<PlanComptableDto> getAllActiveAccounts() {
        String tenantId = TenantContext.getCurrentTenant();
        
        return planComptableRepository.findByTenantIdAndActifTrue(tenantId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PlanComptableDto getAccountById(Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        
        PlanComptable account = planComptableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compte", id.toString()));
        
        if (!tenantId.equals(account.getTenantId())) {
            throw new BusinessException("Compte non accessible pour ce tenant");
        }
        
        return mapToDto(account);
    }

    public List<PlanComptableDto> getAccountsByPrefix(String prefix) {
        String tenantId = TenantContext.getCurrentTenant();
        
        return planComptableRepository.findByTenantIdAndNoCompteStartsWith(tenantId, prefix)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlanComptableDto updateAccount(Long id, PlanComptableDto dto) {
        String tenantId = TenantContext.getCurrentTenant();
        
        PlanComptable account = planComptableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compte", id.toString()));
        
        if (!tenantId.equals(account.getTenantId())) {
            throw new BusinessException("Compte non accessible pour ce tenant");
        }
        
        account.setLibelle(dto.getLibelle());
        account.setNotes(dto.getNotes());
        
        account = planComptableRepository.save(account);
        
        return mapToDto(account);
    }

    @Transactional
    public void deactivateAccount(Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        
        PlanComptable account = planComptableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compte", id.toString()));
        
        if (!tenantId.equals(account.getTenantId())) {
            throw new BusinessException("Compte non accessible pour ce tenant");
        }
        
        account.setActif(false);
        planComptableRepository.save(account);
        
        log.info("Compte désactivé: {}", account.getNoCompte());
    }

    private PlanComptableDto mapToDto(PlanComptable account) {
        return PlanComptableDto.builder()
                .id(account.getId())
                .noCompte(account.getNoCompte())
                .libelle(account.getLibelle())
                .notes(account.getNotes())
                .actif(account.getActif())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
