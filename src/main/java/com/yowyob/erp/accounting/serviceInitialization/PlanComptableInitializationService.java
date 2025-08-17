package com.yowyob.erp.accounting.serviceInitialization;

import com.yowyob.erp.accounting.entity.PlanComptable;
import com.yowyob.erp.accounting.entityKey.PlanComptableKey;
import com.yowyob.erp.accounting.repository.PlanComptableRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

//@Service
public class PlanComptableInitializationService implements CommandLineRunner {

    private final PlanComptableRepository planComptableRepository;

    public PlanComptableInitializationService(PlanComptableRepository planComptableRepository) {
        this.planComptableRepository = planComptableRepository;
    }

    @Override
    public void run(String... args) {
        UUID tenantId = UUID.randomUUID(); // Replace with actual tenant ID
        createAccountIfNotExists(tenantId, "101000", "Capital social");
        createAccountIfNotExists(tenantId, "211000", "Brevets");
        createAccountIfNotExists(tenantId, "311000", "Marchandises");
        createAccountIfNotExists(tenantId, "401000", "Fournisseurs");
        createAccountIfNotExists(tenantId, "411000", "Clients");
        createAccountIfNotExists(tenantId, "521000", "Banques");
        createAccountIfNotExists(tenantId, "601000", "Achats de marchandises");
        createAccountIfNotExists(tenantId, "701000", "Ventes de marchandises");
        createAccountIfNotExists(tenantId, "851000", "Valeurs comptables des cessions");
        createAccountIfNotExists(tenantId, "901000", "Achats incorporés");
    }

    private void createAccountIfNotExists(UUID tenantId, String noCompte, String libelle) {
        if (!planComptableRepository.existsByKeyTenantIdAndNoCompte(tenantId, noCompte)) {
            PlanComptable plan = new PlanComptable();
            PlanComptableKey key = new PlanComptableKey();
            key.setTenantId(tenantId);
            key.setId(UUID.randomUUID());
            plan.setKey(key);
            plan.setNoCompte(noCompte);
            plan.setLibelle(libelle);
            plan.setActif(true);
            plan.setCreatedAt(LocalDateTime.now());
            plan.setUpdatedAt(LocalDateTime.now());
            plan.setCreatedBy("system");
            plan.setUpdatedBy("system");
            planComptableRepository.save(plan);
        }
    }
}