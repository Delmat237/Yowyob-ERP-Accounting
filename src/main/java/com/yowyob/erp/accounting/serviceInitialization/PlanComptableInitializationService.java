package com.yowyob.erp.accounting.serviceInitialization;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import com.yowyob.erp.accounting.entity.PlanComptable;
import com.yowyob.erp.accounting.entityKey.PlanComptableKey;
import com.yowyob.erp.accounting.repository.PlanComptableRepository;

@Service
public class PlanComptableInitializationService implements CommandLineRunner {

    private final PlanComptableRepository planComptableRepository;
    
    private final UUID tenantId ;

    public PlanComptableInitializationService(PlanComptableRepository planComptableRepository,
    @Value("${app.tenant.default-tenant:550e8400-e29b-41d4-a716-446655440000}")
     String tenantIdStr) {
        this.planComptableRepository = planComptableRepository;
        this.tenantId = UUID.fromString(tenantIdStr);
    }

    @Override
    public void run(String... args) {
       
        createAccountIfNotExists(tenantId, "101000", "Capital social",1);
        createAccountIfNotExists(tenantId, "211000", "Brevets",2);
        createAccountIfNotExists(tenantId, "311000", "Marchandises",3);
        createAccountIfNotExists(tenantId, "401000", "Fournisseurs",4);
        createAccountIfNotExists(tenantId, "411000", "Clients",4);
        createAccountIfNotExists(tenantId, "521000", "Banques",5);
        createAccountIfNotExists(tenantId, "601000", "Achats de marchandises",6);
        createAccountIfNotExists(tenantId, "701000", "Ventes de marchandises",7);
        createAccountIfNotExists(tenantId, "851000", "Valeurs comptables des cessions",8);
        createAccountIfNotExists(tenantId, "901000", "Achats incorporés",9);
    }

    private void createAccountIfNotExists(UUID tenantId, String noCompte, String libelle, Integer classe) {
        if (!planComptableRepository.existsByKeyTenantIdAndNoCompte(tenantId, noCompte)) {
            PlanComptable planComptable = new PlanComptable();
            PlanComptableKey key = new PlanComptableKey();
            key.setTenantId(tenantId);
            key.setId(UUID.randomUUID());
            planComptable.setKey(key);
            planComptable.setNoCompte(noCompte);
            planComptable.setLibelle(libelle);
            planComptable.setClasse(classe);
            planComptable.setNotes("Compte initialisé par le service d'initialisation");
            planComptable.setActif(true);
            planComptable.setCreatedAt(LocalDateTime.now());
            planComptable.setUpdatedAt(LocalDateTime.now());
            planComptable.setCreatedBy("system");
            planComptable.setUpdatedBy("system");
            planComptableRepository.save(planComptable);
        }
    }
}