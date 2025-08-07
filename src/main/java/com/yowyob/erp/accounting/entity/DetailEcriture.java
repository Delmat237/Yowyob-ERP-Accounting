package com.yowyob.erp.accounting.entity;

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

@Table("detail_ecriture")
@Data
public class DetailEcriture {

    @PrimaryKey
    private DetailEcritureKey key;

    @NotBlank(message = "L'identifiant du plan comptable ne peut pas être vide")
    @Size(max = 20, message = "L'identifiant du plan comptable ne doit pas dépasser 20 caractères")
    private String planComptableId;

    @NotBlank(message = "Le libellé ne peut pas être vide")
    @Size(max = 255, message = "Le libellé ne doit pas dépasser 255 caractères")
    private String libelle;

    @NotBlank(message = "Le sens ne peut pas être vide")
    @Pattern(regexp = "DEBIT|CREDIT", message = "Le sens doit être DEBIT ou CREDIT")
    private String sens;

    @PositiveOrZero(message = "Le montant débit doit être positif ou zéro")
    private Double montantDebit = 0.0;

    @PositiveOrZero(message = "Le montant crédit doit être positif ou zéro")
    private Double montantCredit = 0.0;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

@PrimaryKeyClass
@Data
class DetailEcritureKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "ecriture_comptable_id", ordinal = 1, type = CLUSTERED)
    @NotNull(message = "L'identifiant de l'écriture comptable ne peut pas être nul")
    private UUID ecritureComptableId;

    @PrimaryKeyColumn(name = "id", ordinal = 2, type = CLUSTERED, ordering = CLUSTERING_ASC)
    private UUID id;
}
