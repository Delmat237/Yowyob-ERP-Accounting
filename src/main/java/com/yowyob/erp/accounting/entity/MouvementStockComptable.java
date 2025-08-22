package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.common.entity.ComptableObject;
import com.yowyob.erp.common.enums.SourceType;


import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.Data;

/**
 * Cette classe représente un mouvement de stock (entrée ou sortie) et génère une écriture avec un impact 
 * sur les comptes de stock et une contrepartie (fournisseur ou banque).
 */
@Data
public class MouvementStockComptable implements ComptableObject {

    private UUID id;
    private int quantite;
    private double coutUnitaire;
    private LocalDate date;
    private String libelle;
    private UUID journalComptableId;
    private boolean isEntree; // true pour entrée, false pour sortie
    private UUID fournisseurId; // ou banqueId selon le cas

    public MouvementStockComptable(UUID id, int quantite, double coutUnitaire, LocalDate date, 
                                  String libelle, UUID journalComptableId, boolean isEntree, UUID fournisseurId) {
        this.id = id;
        this.quantite = quantite;
        this.coutUnitaire = coutUnitaire;
        this.date = date;
        this.libelle = libelle;
        this.journalComptableId = journalComptableId;
        this.isEntree = isEntree;
        this.fournisseurId = fournisseurId;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public double getMontant() {
        return quantite * coutUnitaire;
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
        double montantTotal = getMontant();

        // Ligne 1 : Débit ou Crédit Stock
        DetailEcriture stock = new DetailEcriture();
        stock.setTenantId(tenantId);
        //stock.setEcritureId(ecritureId);
        //stock.setCompteComptableId("603000"); // Variation de stock
        stock.setMontantDebit(isEntree ? montantTotal:0.0);
        stock.setMontantCredit(isEntree ? 0.0:montantTotal);
        stock.setSens(isEntree?"DEBIT":"CREDIT"); // Débit pour entrée, Crédit pour sortie
        details.add(stock);

        // Ligne 2 : Crédit ou Débit Contrepartie
        DetailEcriture contrepartie = new DetailEcriture();
        contrepartie.setTenantId(tenantId);
        //contrepartie.setEcritureId(ecritureId);
        //contrepartie.setCompteComptableId(fournisseurId != null ? "401000" : "512000"); // Fournisseur ou Banque
         stock.setMontantDebit(!isEntree ? montantTotal:0.0);
        stock.setMontantCredit(!isEntree ? 0.0:montantTotal);
        stock.setSens(!isEntree?"DEBIT":"CREDIT"); // Débit pour entrée, Crédit pour sortie
        details.add(contrepartie);

        return details;
    }

    @Override
    public SourceType getSourceType() {
        return SourceType.STOCK;
    }

    
}