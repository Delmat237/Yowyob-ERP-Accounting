package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.common.entity.ComptableObject;
import com.yowyob.erp.common.enums.SourceType;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Cette classe représente une transaction comptable (ex. un paiement ou un reçu) et génère une écriture avec deux lignes :
 *  un débit et un crédit basés sur les comptes spécifiés.
 */
@Data
public class TransactionComptable implements ComptableObject {

    private UUID id;
    private double montant;
    private LocalDate date;
    private String libelle;
    private UUID journalComptableId;
    private UUID comptePrincipalId; // Compte débité ou crédité (ex. 512000 pour banque)
    private UUID contrepartieId;   // Compte contrepartie (ex. 401000 pour fournisseur)

    public TransactionComptable(UUID id, double montant, LocalDate date, String libelle, 
                               UUID journalComptableId, UUID comptePrincipalId, UUID contrepartieId) {
        this.id = id;
        this.montant = montant;
        this.date = date;
        this.libelle = libelle;
        this.journalComptableId = journalComptableId;
        this.comptePrincipalId = comptePrincipalId;
        this.contrepartieId = contrepartieId;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public double getMontant() {
        return montant;
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

        // Ligne 1 : Débit sur le compte principal
        DetailEcriture debit = new DetailEcriture();
        debit.setTenantId(tenantId);
        //debit.setEcritureId(ecritureId);
        debit.setMontantDebit(montant);
        debit.setSens("DEBIT ");
        details.add(debit);

        // Ligne 2 : Crédit sur la contrepartie
        DetailEcriture credit = new DetailEcriture();
        credit.setTenantId(tenantId);
        //credit.setEcritureId(ecritureId);
        credit.setMontantCredit(montant);
        credit.setSens("CREDIT");
        details.add(credit);

        return details;
    }

    @Override
    public SourceType getSourceType() {
        return SourceType.TRANSACTION;
    }

}