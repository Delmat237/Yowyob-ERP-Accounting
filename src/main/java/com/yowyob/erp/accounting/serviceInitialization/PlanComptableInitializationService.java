package com.yowyob.erp.accounting.serviceInitialization;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
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
    
    private final UUID tenantId;

    public PlanComptableInitializationService(PlanComptableRepository planComptableRepository,
    @Value("${app.tenant.default-tenant:550e8400-e29b-41d4-a716-446655440000}")
     String tenantIdStr) {
        this.planComptableRepository = planComptableRepository;
        this.tenantId = UUID.fromString(tenantIdStr);
    }

    @Override
    public void run(String... args) {
        try (InputStream inputStream = getClass().getResourceAsStream("/comptes_comptables.csv");
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue; // Skip header row
                }
                String[] data = line.split(",");
                if (data.length >= 4) {
                    String noCompte = data[1].trim();
                    String libelle = data[2].trim();
                    Integer classe = Integer.parseInt(data[3].trim());
                    createAccountIfNotExists(tenantId, noCompte, libelle, classe);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
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
