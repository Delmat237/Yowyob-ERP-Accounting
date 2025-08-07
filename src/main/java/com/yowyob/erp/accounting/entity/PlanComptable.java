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

@Table("plan_comptable")
@Data
public class PlanComptable implements Auditable {

    @PrimaryKey
    private PlanComptableKey key;

    @NotBlank(message = "Le numéro de compte ne peut pas être vide")
    @Size(max = 20, message = "Le numéro de compte ne doit pas dépasser 20 caractères")
    private String noCompte;

    @NotBlank(message = "Le libellé ne peut pas être vide")
    @Size(max = 255, message = "Le libellé ne doit pas dépasser 255 caractères")
    private String libelle;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    @NotNull(message = "Le statut actif ne peut pas être nul")
    private Boolean actif = true;

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
            key = new PlanComptableKey();
        }
        key.setTenantId(tenantId);
    }
}

@PrimaryKeyClass
@Data
class PlanComptableKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "no_compte", ordinal = 1, type = CLUSTERED, ordering = CLUSTERING_ASC)
    @NotBlank(message = "Le numéro de compte ne peut pas être vide")
    @Size(max = 20, message = "Le numéro de compte ne doit pas dépasser 20 caractères")
    private String noCompte;

    @PrimaryKeyColumn(name = "id", ordinal = 2, type = CLUSTERED)
    private UUID id;
}
