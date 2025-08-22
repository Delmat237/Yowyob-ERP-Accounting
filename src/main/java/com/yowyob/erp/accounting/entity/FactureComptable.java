package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.common.entity.ComptableObject;    
import com.yowyob.erp.common.enums.SourceType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.Data;
/**
 * Cette classe représente une facture comptable avec gestion de la 
 * TVA (18% selon OHADA) et génère une écriture avec trois lignes : vente (débit), TVA (crédit), et client/fournisseur (crédit).
 */
@Data
public class FactureComptable implements ComptableObject {

    private UUID id;
    private double montantHT;
    private double tauxTVA = 0.18; // 18% par défaut selon OHADA
    private LocalDate date;
    private String libelle;
    private UUID journalComptableId;
    private UUID clientId; // ou fournisseurId selon le cas
    private boolean isAchat; // true pour achat, false pour vente

    public FactureComptable(UUID id, double montantHT, LocalDate date, String libelle, 
                           UUID journalComptableId, UUID clientId, boolean isAchat) {
        this.id = id;
        this.montantHT = montantHT;
        this.date = date;
        this.libelle = libelle;
        this.journalComptableId = journalComptableId;
        this.clientId = clientId;
        this.isAchat = isAchat;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public double getMontant() {
        return montantHT * (1 + tauxTVA); // Montant TTC
    }

    @Override
    public LocalDate getDate() {
        return date;
    }

    @Override
    public String getLibelle() {
        return libelle;
    }

    @Override
    public UUID getJournalComptableId() {
        return journalComptableId;
    }

    @Override
    public List<DetailEcriture> generateEcritureDetails(UUID tenantId, UUID ecritureId) {
        List<DetailEcriture> details = new ArrayList<>();
        double montantTVA = montantHT * tauxTVA;
        double montantTTC = getMontant();

        // Ligne 1 : Débit (Compte de vente ou achat)
        DetailEcriture debit = new DetailEcriture();
        debit.setTenantId(tenantId);
        //debit.setEcritureId(ecritureId);
       // debit.setPlanComptableId(isAchat ? "601000" : "701000"); // Achat ou Vente
        debit.setMontantDebit(montantHT);
        debit.setSens("DEBIT");
        details.add(debit);

        // Ligne 2 : Crédit TVA
        DetailEcriture tva = new DetailEcriture();
        tva.setTenantId(tenantId);
        //tva.setEcritureId(ecritureId);
       // tva.setCompteComptableId(isAchat ? "445620" : "445710"); // TVA déductible ou collectée
        tva.setMontantCredit(montantTVA);
        tva.setSens("CREDIT");
        details.add(tva);

        // Ligne 3 : Crédit Client/Fournisseur
        DetailEcriture credit = new DetailEcriture();
        credit.setTenantId(tenantId);
        //credit.setEcritureId(ecritureId);
        //credit.setCompteComptableId(isAchat ? "401000" : "411000"); // Fournisseur ou Client
        credit.setMontantCredit(montantTTC);
        credit.setSens("CREDIT");
        details.add(credit);

        return details;
    }

    @Override
    public SourceType getSourceType() {
        return SourceType.FACTURE;
    }

  
}