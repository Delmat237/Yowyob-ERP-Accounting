package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.TransactionKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("transaction")
@Data
public class Transaction implements Auditable {

    @PrimaryKey
    private TransactionKey key;

    @Size(max = 100, message = "Le numéro de reçu ne doit pas dépasser 100 caractères")
    private String numeroRecu;

    private UUID operationComptableId;

    @NotNull(message = "Le montant de la transaction ne peut pas être nul")
    @PositiveOrZero(message = "Le montant de la transaction doit être positif ou zéro")
    private Double montantTransaction;

    @Size(max = 255, message = "Le montant en lettre ne doit pas dépasser 255 caractères")
    private String montantLettre;

    @NotNull(message = "Le statut montant TTC ne peut pas être nul")
    private Boolean estMontantTTC = true;

    @NotNull(message = "La date de transaction ne peut pas être nulle")
    private LocalDateTime dateTransaction;

    @NotNull(message = "Le statut validé ne peut pas être nul")
    private Boolean estValidee = false;

    private LocalDateTime dateValidation;

    @Size(max = 255, message = "La référence objet ne doit pas dépasser 255 caractères")
    private String referenceObjet;

    @Size(max = 255, message = "Le caissier ne doit pas dépasser 255 caractères")
    private String caissier;

    @NotNull(message = "Le statut comptabilisé ne peut pas être nul")
    private Boolean estComptabilisee = false;

    private UUID ecritureComptableId;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Size(max = 255, message = "Créé par ne doit pas dépasser 255 caractères")
    private String createdBy;

    @Size(max = 255, message = "Mis à jour par ne doit pas dépasser 255 caractères")
    private String updatedBy;

    @Override
    public UUID getTenantId() {
        return key.getTenantId();
    }

    @Override
    public void setTenantId(UUID tenantId) {
        if (key == null) {
            key = new TransactionKey();
        }
        key.setTenantId(tenantId);
    }
}