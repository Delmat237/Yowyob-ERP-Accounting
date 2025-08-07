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

@Table("operation_comptable")
@Data
public class OperationComptable implements Auditable {

    @PrimaryKey
    private OperationComptableKey key;

    @NotBlank(message = "Le type d'opération ne peut pas être vide")
    @Size(max = 50, message = "Le type d'opération ne doit pas dépasser 50 caractères")
    private String typeOperation;

    @NotBlank(message = "Le mode de règlement ne peut pas être vide")
    @Size(max = 50, message = "Le mode de règlement ne doit pas dépasser 50 caractères")
    private String modeReglement;

    @NotBlank(message = "Le compte principal ne peut pas être vide")
    @Size(max = 20, message = "Le compte principal ne doit pas dépasser 20 caractères")
    private String comptePrincipal;

    @NotNull(message = "Le statut compte statique ne peut pas être nul")
    private Boolean estCompteStatique = false;

    @NotBlank(message = "Le sens principal ne peut pas être vide")
    @Pattern(regexp = "DEBIT|CREDIT", message = "Le sens principal doit être DEBIT ou CREDIT")
    private String sensPrincipal;

    @NotBlank(message = "L'identifiant du journal comptable ne peut pas être vide")
    @Size(max = 20, message = "L'identifiant du journal comptable ne doit pas dépasser 20 caractères")
    private String journalComptableId;

    @NotBlank(message = "Le type de montant ne peut pas être vide")
    @Pattern(regexp = "HT|TTC|TVA|PAU", message = "Le type de montant doit être HT, TTC, TVA ou PAU")
    private String typeMontant;

    @PositiveOrZero(message = "Le plafond client doit être positif ou zéro")
    private Double plafondClient;

    @NotNull(message = "Le statut actif ne peut pas être nul")
    private Boolean actif = true;

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
            key = new OperationComptableKey();
        }
        key.setTenantId(tenantId);
    }
}

@PrimaryKeyClass
@Data
class OperationComptableKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "id", ordinal = 1, type = CLUSTERED, ordering = CLUSTERING_ASC)
    private UUID id;
}
