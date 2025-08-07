package com.yowyob.erp.accounting.entity;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.data.cassandra.core.cql.Ordering.CLUSTERING_ASC;
import static org.springframework.data.cassandra.core.cql.PrimaryKeyType.CLUSTERED;
import static org.springframework.data.cassandra.core.cql.PrimaryKeyType.PARTITIONED;

@Table("declaration_fiscale")
@Data
public class DeclarationFiscale {

    @PrimaryKey
    private DeclarationFiscaleKey key;

    @NotBlank(message = "Le type de déclaration ne peut pas être vide")
    @Size(max = 50, message = "Le type de déclaration ne doit pas dépasser 50 caractères")
    private String typeDeclaration;

    @NotNull(message = "La période de début ne peut pas être nulle")
    private LocalDate periodeDebut;

    @NotNull(message = "La période de fin ne peut pas être nulle")
    private LocalDate periodeFin;

    @NotNull(message = "Le montant total ne peut pas être nul")
    @PositiveOrZero(message = "Le montant total doit être positif ou zéro")
    private Double montantTotal;

    @NotNull(message = "La date de génération ne peut pas être nulle")
    private LocalDate dateGeneration;

    @NotBlank(message = "Le statut ne peut pas être vide")
    @Pattern(regexp = "DRAFT|SUBMITTED|VALIDATED", message = "Le statut doit être DRAFT, SUBMITTED ou VALIDATED")
    private String statut;

    @Size(max = 100, message = "Le numéro de déclaration ne doit pas dépasser 100 caractères")
    private String numeroDeclaration;

    private String donneesDeclaration;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    private LocalDate createdAt;

    private LocalDate updatedAt;
}

@PrimaryKeyClass
@Data
class DeclarationFiscaleKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "id", ordinal = 1, type = CLUSTERED, ordering = CLUSTERING_ASC)
    private UUID id;
}
