package com.yowyob.erp.accounting.serviceInitialization;

import com.yowyob.erp.accounting.entity.JournalComptable;
import com.yowyob.erp.accounting.entityKey.JournalComptableKey;
import com.yowyob.erp.accounting.repository.JournalComptableRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class JournalComptableInitializationService implements CommandLineRunner {

    private final JournalComptableRepository journalComptableRepository;
    private final UUID tenantId;


    public JournalComptableInitializationService(JournalComptableRepository journalComptableRepository,
     @Value("${app.tenant.default-tenant:550e8400-e29b-41d4-a716-446655440000}")
     String tenantIdStr) {
        this.journalComptableRepository = journalComptableRepository;
            this.tenantId = UUID.fromString(tenantIdStr);

    }

    @Override
    public void run(String... args) {
        createJournalIfNotExists(tenantId, "AN", "Journal des Achats", "ACHAT");
        createJournalIfNotExists(tenantId, "VE", "Journal des Ventes", "VENTE");
        createJournalIfNotExists(tenantId, "TR", "Journal de Trésorerie", "TRESORERIE");
        createJournalIfNotExists(tenantId, "OD", "Journal des Opérations Diverses", "DIVERS");
    }

    private void createJournalIfNotExists(UUID tenantId, String codeJournal, String libelle, String typeJournal) {
        if (!journalComptableRepository.existsByKeyTenantIdAndCodeJournal(tenantId, codeJournal)) {
            JournalComptable journal = new JournalComptable();
            JournalComptableKey key = new JournalComptableKey();
            key.setTenantId(tenantId);
            key.setId(UUID.randomUUID());
            journal.setKey(key);
            journal.setCodeJournal(codeJournal);
            journal.setLibelle(libelle);
            journal.setTypeJournal(typeJournal);
            journal.setActif(true);
            journal.setCreatedAt(LocalDateTime.now());
            journal.setUpdatedAt(LocalDateTime.now());
            journal.setCreatedBy("system");
            journal.setUpdatedBy("system");
            journalComptableRepository.save(journal);
        }
    }
}
