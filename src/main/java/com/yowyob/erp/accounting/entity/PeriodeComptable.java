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

@Table("periode_comptable")
@Data
public class PeriodeComptable implements Auditable {

    @PrimaryKey
    private PeriodeComptableKey key;

    @NotBlank(message = "Le code ne peut pas être vide")
    @Size(max = 50, message = "Le code ne doit pas dépasser 50 caractères")
    private String code;

    @NotNull(message = "La date de début ne peut pas être nulle")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin ne peut pas être nulle")
    private LocalDate dateFin;

    @NotNull(message = "Le statut clôturé ne peut pas être nul")
    private Boolean cloturee = false;

    private LocalDate dateCloture;

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
            key = new PeriodeComptableKey();
        }
        key.setTenantId(tenantId);
    }
}

@PrimaryKeyClass
@Data
class PeriodeComptableKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "id", ordinal = 1, type = CLUSTERED, ordering = CLUSTERING_ASC)
    private UUID id;
}
