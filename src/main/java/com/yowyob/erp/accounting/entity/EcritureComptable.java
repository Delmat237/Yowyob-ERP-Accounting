package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.EcritureComptableKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

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

    @NotNull(message = "L'identifiant du journal comptable ne peut pas être nul")
    private UUID journalComptableId;

    @NotNull(message = "L'identifiant de la période comptable ne peut pas être nul")
    private UUID periodeComptableId;

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

    @Size(max = 1000, message = "Les notes ne doivent pas dépasser 1000 caractères")
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

    @Override
    public UUID getTenantId() {
        return key != null ? key.getTenantId() : null;
    }

    @Override
    public void setTenantId(UUID tenantId) {
        if (key == null) {
            key = new EcritureComptableKey();
        }
        key.setTenantId(tenantId);
    }
}