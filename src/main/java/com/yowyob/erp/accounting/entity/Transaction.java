package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.TransactionKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.Column;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.redis.core.RedisHash;

//@RedisHash("transaction")
@Table("transaction")
@Data
public class Transaction implements Auditable {

    @PrimaryKey
    private TransactionKey key;

    @Size(max = 100, message = "Le numéro de reçu ne doit pas dépasser 100 caractères")
    @Column("numero_recu")
    private String numeroRecu;

    @Column("operation_comptable_id")
    private UUID operationComptableId;

    @NotNull(message = "Le montant de la transaction ne peut pas être nul")
    @PositiveOrZero(message = "Le montant de la transaction doit être positif ou zéro")
    @Column("montant_transaction")
    private Double montantTransaction;

    @Size(max = 255, message = "Le montant en lettre ne doit pas dépasser 255 caractères")
    @Column("montant_lettre")
    private String montantLettre;

    @NotNull(message = "Le statut montant TTC ne peut pas être nul")
    @Column("est_montant_ttc")
    private Boolean estMontantTTC = true;

    @NotNull(message = "La date de transaction ne peut pas être nulle")
    @Column("date_transaction")
    private LocalDateTime dateTransaction;

    @NotNull(message = "Le statut validé ne peut pas être nul")
    @Column("est_validee")
    private Boolean estValidee = false;

    @Column("date_validation")
    private LocalDateTime dateValidation;

    @Size(max = 255, message = "La référence objet ne doit pas dépasser 255 caractères")
    @Column("reference_objet")
    private String referenceObjet;

    @Size(max = 255, message = "Le caissier ne doit pas dépasser 255 caractères")
    @Column("caissier")
    private String caissier;

    @NotNull(message = "Le statut comptabilisé ne peut pas être nul")
    @Column("est_comptabilisee")
    private Boolean estComptabilisee = false;

    @NotNull(message = "L'identifiant de l'écriture comptable ne peut pas être nul")
    @Column("ecriture_comptable_id")
    private UUID ecritureComptableId;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Size(max = 255, message = "Créé par ne doit pas dépasser 255 caractères")
    @Column("created_by")
    private String createdBy;

    @Size(max = 255, message = "Mis à jour par ne doit pas dépasser 255 caractères")
    @Column("updated_by")
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