package com.yowyob.erp.accounting.serviceInitialization;

import com.yowyob.erp.accounting.entity.JournalComptable;
import com.yowyob.erp.accounting.entityKey.JournalComptableKey;
import com.yowyob.erp.accounting.repository.JournalComptableRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class JournalComptableInitializationService implements CommandLineRunner {

    private final JournalComptableRepository journalComptableRepository;

    public JournalComptableInitializationService(JournalComptableRepository journalComptableRepository) {
        this.journalComptableRepository = journalComptableRepository;
    }

    @Override
    public void run(String... args) {
        UUID tenantId = UUID.randomUUID(); // Replace with actual tenant ID
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
