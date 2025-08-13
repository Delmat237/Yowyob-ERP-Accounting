package com.yowyob.erp.accounting.serviceInitialization;

import com.yowyob.erp.accounting.entity.JournalComptable;
import com.yowyob.erp.accounting.entity.OperationComptable;
import com.yowyob.erp.accounting.entityKey.OperationComptableKey;
import com.yowyob.erp.accounting.repository.JournalComptableRepository;
import com.yowyob.erp.accounting.repository.OperationComptableRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class OperationComptableInitializationService implements CommandLineRunner {

    private final OperationComptableRepository operationComptableRepository;
    private final JournalComptableRepository journalComptableRepository;

    public OperationComptableInitializationService(OperationComptableRepository operationComptableRepository, JournalComptableRepository journalComptableRepository) {
        this.operationComptableRepository = operationComptableRepository;
        this.journalComptableRepository = journalComptableRepository;
    }

    @Override
    public void run(String... args) {
        UUID tenantId = UUID.randomUUID(); // Replace with actual tenant ID
        JournalComptable journalAN = journalComptableRepository.findByKeyTenantIdAndCodeJournal(tenantId, "AN")
                .orElseThrow(() -> new IllegalStateException("Journal AN not found"));
        JournalComptable journalVE = journalComptableRepository.findByKeyTenantIdAndCodeJournal(tenantId, "VE")
                .orElseThrow(() -> new IllegalStateException("Journal VE not found"));
        JournalComptable journalTR = journalComptableRepository.findByKeyTenantIdAndCodeJournal(tenantId, "TR")
                .orElseThrow(() -> new IllegalStateException("Journal TR not found"));

        createOperationIfNotExists(tenantId, "ACHAT", "ESPECE", "401000", false, "DEBIT", journalAN.getKey().getId(), "HT", 1000000.0);
        createOperationIfNotExists(tenantId, "VENTE", "ESPECE", "701000", false, "CREDIT", journalVE.getKey().getId(), "TTC", 1000000.0);
        createOperationIfNotExists(tenantId, "PAIEMENT", "VIREMENT", "512000", false, "CREDIT", journalTR.getKey().getId(), "TTC", 5000000.0);
    }

    private void createOperationIfNotExists(UUID tenantId, String typeOperation, String modeReglement, String comptePrincipal, boolean estCompteStatique, String sensPrincipal, UUID journalComptableId, String typeMontant, double plafondClient) {
        if (!operationComptableRepository.findByKeyTenantIdAndTypeOperationAndModeReglement(tenantId, typeOperation, modeReglement).isPresent()) {
            OperationComptable operation = new OperationComptable();
            OperationComptableKey key = new OperationComptableKey();
            key.setTenantId(tenantId);
            key.setId(UUID.randomUUID());
            operation.setKey(key);
            operation.setTypeOperation(typeOperation);
            operation.setModeReglement(modeReglement);
            operation.setComptePrincipal(comptePrincipal);
            operation.setEstCompteStatique(estCompteStatique);
            operation.setSensPrincipal(sensPrincipal);
            operation.setJournalComptableId(journalComptableId);
            operation.setTypeMontant(typeMontant);
            operation.setPlafondClient(plafondClient);
            operation.setActif(true);
            operation.setCreatedAt(LocalDateTime.now());
            operation.setUpdatedAt(LocalDateTime.now());
            operation.setCreatedBy("system");
            operation.setUpdatedBy("system");
            operationComptableRepository.save(operation);
        }
    }
}