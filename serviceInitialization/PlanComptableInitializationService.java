package com.yowyob.erp.accounting.serviceInitialization;

import com.yowyob.erp.accounting.dto.PlanComptableDto;
import com.yowyob.erp.accounting.service.PlanComptableService;
import com.yowyob.erp.config.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class PlanComptableInitializationService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(PlanComptableInitializationService.class);
    private final PlanComptableService planComptableService;

    public PlanComptableInitializationService(PlanComptableService planComptableService) {
        this.planComptableService = planComptableService;
    }

    @Override
    public void run(String... args) {
        // Replace with actual tenant ID or iterate over all tenants
        UUID tenantId = UUID.randomUUID(); // Placeholder; use TenantContext or configuration
        TenantContext.setCurrentTenant(tenantId);
        TenantContext.setCurrentUser("system");

        List<PlanComptableDto> ohadaAccounts = Arrays.asList(
                // Classe 1: Comptes de capitaux
                PlanComptableDto.builder()
                        .noCompte("101000")
                        .libelle("Capital social")
                        .actif(true)
                        .notes("Compte pour le capital social")
                        .build(),
                PlanComptableDto.builder()
                        .noCompte("106110")
                        .libelle("Réserves légales")
                        .actif(true)
                        .notes("Réserves obligatoires selon OHADA")
                        .build(),

                // Classe 2: Comptes d'immobilisations
                PlanComptableDto.builder()
                        .noCompte("201000")
                        .libelle("Immobilisations incorporelles")
                        .actif(true)
                        .notes("Logiciels et brevets")
                        .build(),
                PlanComptableDto.builder()
                        .noCompte("211000")
                        .libelle("Terrains")
                        .actif(true)
                        .notes("Immobilisations corporelles")
                        .build(),

                // Classe 3: Comptes de stocks
                PlanComptableDto.builder()
                        .noCompte("301000")
                        .libelle("Marchandises")
                        .actif(true)
                        .notes("Stocks de marchandises")
                        .build(),

                // Classe 4: Comptes de tiers
                PlanComptableDto.builder()
                        .noCompte("401000")
                        .libelle("Fournisseurs")
                        .actif(true)
                        .notes("Dettes fournisseurs")
                        .build(),
                PlanComptableDto.builder()
                        .noCompte("411000")
                        .libelle("Clients")
                        .actif(true)
                        .notes("Créances clients")
                        .build(),

                // Classe 5: Comptes financiers
                PlanComptableDto.builder()
                        .noCompte("501000")
                        .libelle("Banque")
                        .actif(true)
                        .notes("Compte bancaire principal")
                        .build(),
                PlanComptableDto.builder()
                        .noCompte("511000")
                        .libelle("Caisse")
                        .actif(true)
                        .notes("Caisse espèces")
                        .build(),

                // Classe 6: Comptes de charges
                PlanComptableDto.builder()
                        .noCompte("601000")
                        .libelle("Achats de marchandises")
                        .actif(true)
                        .notes("Charges d'achats")
                        .build(),
                PlanComptableDto.builder()
                        .noCompte("641000")
                        .libelle("Salaires")
                        .actif(true)
                        .notes("Charges de personnel")
                        .build(),

                // Classe 7: Comptes de produits
                PlanComptableDto.builder()
                        .noCompte("701000")
                        
                        .libelle("Ventes de marchandises")
                        .actif(true)
                        .notes("Revenus des ventes")
                        .build(),
                PlanComptableDto.builder()
                        .noCompte("707000")
                        
                        .libelle("Prestations de services")
                        .actif(true)
                        .notes("Revenus des services")
                        .build(),

                // TVA (Classe 4)
                PlanComptableDto.builder()
                        .noCompte("445710")
                        
                        .libelle("TVA collectée")
                        .actif(true)
                        .notes("TVA due sur ventes")
                        .build(),
                PlanComptableDto.builder()
                        .noCompte("445660")
                        
                        .libelle("TVA déductible")
                        .actif(true)
                        .notes("TVA récupérable sur achats")
                        .build()
        );

        for (PlanComptableDto account : ohadaAccounts) {
            try {
                planComptableService.createAccount(account);
                logger.info("Initialized OHADA account: {} for tenant: {}", account.getNoCompte(), tenantId);
            } catch (IllegalArgumentException e) {
                logger.warn("Account {} already exists for tenant: {}, skipping.", account.getNoCompte(), tenantId);
            }
        }
    }
}