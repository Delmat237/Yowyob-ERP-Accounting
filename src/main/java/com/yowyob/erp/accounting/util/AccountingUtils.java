package com.yowyob.erp.accounting.util;

import  com.yowyob.erp.common.dto.ComptableObjectRequest;
import  com.yowyob.erp.common.entity.ComptableObject;
import com.yowyob.erp.accounting.entity.FactureComptable;
import com.yowyob.erp.accounting.entity.MouvementStockComptable;
import com.yowyob.erp.accounting.entity.TransactionComptable; 

import java.time.LocalDate;
import java.util.UUID;

public class AccountingUtils {

    public static ComptableObject mapToComptableObject(ComptableObjectRequest request) {
        if (request == null || request.getType() == null) {
            throw new IllegalArgumentException("Type de l'objet comptable est requis");
        }

        UUID tenantId = request.getTenantId();
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();
        UUID journalComptableId = request.getJournalComptableId();

        switch (request.getType()) {
            case TRANSACTION:
                if (request.getMontant() == null) {
                    throw new IllegalArgumentException("Montant requis pour une transaction");
                }
                return new TransactionComptable(
                    request.getId() ,
                    request.getMontant(),
                    date,
                    request.getLibelle(),
                    journalComptableId,
                    request.getClientId(),
                  request.getContrepartieId()
                );

            case FACTURE:
                if (request.getMontantHT() == null || request.getClientId() == null) {
                    throw new IllegalArgumentException("Montant HT et clientId requis pour une facture");
                }
                return new FactureComptable(
                    request.getId(),
                    request.getMontantHT(),
                    date,
                    request.getLibelle(),
                    journalComptableId,
                   request.getClientId(),
                    Boolean.TRUE.equals(request.getIsAchat()) // Achat ou vente
                );

            case STOCK:
                if (request.getQuantite() == null || request.getCoutUnitaire() == null || request.getFournisseurId() == null) {
                    throw new IllegalArgumentException("Quantité, coût unitaire et fournisseurId requis pour un mouvement de stock");
                }
                return new MouvementStockComptable(
                    request.getId(),
                    request.getQuantite(),
                    request.getCoutUnitaire(),
                    date,
                    request.getLibelle(),
                    journalComptableId,
                    Boolean.TRUE.equals(request.getIsEntree()), // Entrée ou sortie
                    request.getFournisseurId()
                );

            default:
                throw new IllegalArgumentException("Type d'objet comptable non supporté : " + request.getType());
        }
    }
}