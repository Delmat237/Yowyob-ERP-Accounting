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

@Table("contrepartie")
@Data
public class Contrepartie {

    @PrimaryKey
    private ContrepartieKey key;

    @NotBlank(message = "Le compte ne peut pas être vide")
    @Size(max = 20, message = "Le compte ne doit pas dépasser 20 caractères")
    private String compte;

    @NotNull(message = "Est compte tiers ne peut pas être null")
    private Boolean estCompteTiers = false;

    @NotBlank(message = "Le sens ne peut pas être vide")
    @Pattern(regexp = "DEBIT|CREDIT", message = "Le sens doit être DEBIT ou CREDIT")
    private String sens;

    @NotBlank(message = "Le type de montant ne peut pas être vide")
    @Pattern(regexp = "HT|TTC|TVA|PAU", message = "Le type de montant doit être HT, TTC, TVA ou PAU")
    private String typeMontant;

    @NotBlank(message = "L'identifiant du journal comptable ne peut pas être vide")
    @Size(max = 20, message = "L'identifiant du journal comptable ne doit pas dépasser 20 caractères")
    private String journalComptableId;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

@PrimaryKeyClass
@Data
class ContrepartieKey {

    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "operation_comptable_id", ordinal = 1, type = CLUSTERED)
    @NotNull(message = "L'identifiant de l'opération comptable ne peut pas être null")
    private UUID operationComptableId;

    @PrimaryKeyColumn(name = "id", ordinal = 2, type = CLUSTERED, ordering = CLUSTERING_ASC)
    private UUID id;
}
