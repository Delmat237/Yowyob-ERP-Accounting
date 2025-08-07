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

@Table("journal_comptable")
@Data
public class JournalComptable {

    @PrimaryKey
    private JournalComptableKey key;

    @NotBlank(message = "Le code journal ne peut pas être vide")
    @Size(max = 20, message = "Le code journal ne doit pas dépasser 20 caractères")
    private String codeJournal;

    @NotBlank(message = "Le libellé ne peut pas être vide")
    @Size(max = 255, message = "Le libellé ne doit pas dépasser 255 caractères")
    private String libelle;

    @NotBlank(message = "Le type de journal ne peut pas être vide")
    @Size(max = 50, message = "Le type de journal ne doit pas dépasser 50 caractères")
    private String typeJournal;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    @NotNull(message = "Le statut actif ne peut pas être nul")
    private Boolean actif = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

@PrimaryKeyClass
@Data
class JournalComptableKey {
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PARTITIONED)
    @NotBlank(message = "L'identifiant du tenant ne peut pas être vide")
    @Size(max = 255, message = "L'identifiant du tenant ne doit pas dépasser 255 caractères")
    private String tenantId;

    @PrimaryKeyColumn(name = "code_journal", ordinal = 1, type = CLUSTERED, ordering = CLUSTERING_ASC)
    @NotBlank(message = "Le code journal ne peut pas être vide")
    @Size(max = 20, message = "Le code journal ne doit pas dépasser 20 caractères")
    private String codeJournal;

    @PrimaryKeyColumn(name = "id", ordinal = 2, type = CLUSTERED)
    private UUID id;
}
