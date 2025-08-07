package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.data.cassandra.core.cql.Ordering.CLUSTERING_ASC;
import static org.springframework.data.cassandra.core.cql.PrimaryKeyType.CLUSTERED;
import static org.springframework.data.cassandra.core.cql.PrimaryKeyType.PARTITIONED;

@Table("transaction")
@Data
public class Transaction implements Auditable {

    @PrimaryKey
    private TransactionKey key;

    @Size(max = 100, message = "Le numéro de reçu ne doit pas dépasser 100 caractères")
    private String numeroRecu;

    @Size(max = 100, message = "L'identifiant de l'opération comptable ne doit pas dépasser 100 caractères")
    private String operationComptableId;

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

    @Size(max = 100, message = "L'identifiant de l'écriture comptable ne doit pas dépasser 100 caractères")
    private String ecritureComptableId;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Size(max = 255, message = "Créé par ne doit pas dépasser 255 caractères")
    private String createdBy;

    @Size(max = 255, message = "Mis à jour par ne doit pas dépasser 255 caractères")
    private String updatedBy;

    @Override
    public String getTenantId() {
        return key.getTenantId();
    }

    @Override
    public void setTenantId(String tenantId) {
        if (key == null) {
            key = new TransactionKey();
        }
        key.setTenantId(tenantId);
    }
}

@PrimaryKeyClass
@Data
class TransactionKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "id", ordinal = 1, type = CLUSTERED, ordering = CLUSTERING_ASC)
    private UUID id;
}
