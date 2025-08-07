package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.data.cassandra.core.cql.Ordering.CLUSTERING_ASC;
import static org.springframework.data.cassandra.core.cql.PrimaryKeyType.CLUSTERED;
import static org.springframework.data.cassandra.core.cql.PrimaryKeyType.PARTITIONED;

@Table("ecriture_comptable")
@Data
public class EcritureComptable implements Auditable {

    @PrimaryKey
    private EcritureComptableKey key;

    @NotBlank(message = "Le numéro d'écriture ne peut pas être vide")
    @Size(max = 100, message = "Le numéro d'écriture ne doit pas dépasser 100 caractères")
    private String numeroEcriture;

    @NotBlank(message = "Le libellé ne peut pas être vide")
    @Size(max = 255, message = "Le libellé ne doit pas dépasser 255 caractères")
    private String libelle;

    @NotNull(message = "La date d'écriture ne peut pas être nulle")
    private LocalDate dateEcriture;

    @NotBlank(message = "L'identifiant du journal comptable ne peut pas être vide")
    @Size(max = 20, message = "L'identifiant du journal comptable ne doit pas dépasser 20 caractères")
    private String journalComptableId;

    @NotBlank(message = "L'identifiant de la période comptable ne peut pas être vide")
    @Size(max = 50, message = "L'identifiant de la période comptable ne doit pas dépasser 50 caractères")
    private String periodeComptableId;

    @NotNull(message = "Le montant total ne peut pas être nul")
    @PositiveOrZero(message = "Le montant total doit être positif ou zéro")
    private Double montantTotal;

    @NotNull(message = "Le statut validée ne peut pas être nul")
    private Boolean validee = false;

    private LocalDateTime dateValidation;

    @Size(max = 255, message = "L'utilisateur de validation ne doit pas dépasser 255 caractères")
    private String utilisateurValidation;

    @Size(max = 255, message = "La référence externe ne doit pas dépasser 255 caractères")
    private String referenceExterne;

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
            key = new EcritureComptableKey();
        }
        key.setTenantId(tenantId);
    }
}

@PrimaryKeyClass
@Data
class EcritureComptableKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "id", ordinal = 1, type = CLUSTERED, ordering = CLUSTERING_ASC)
    private UUID id;
}
