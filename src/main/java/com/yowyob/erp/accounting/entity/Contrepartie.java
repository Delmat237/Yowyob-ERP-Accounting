package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.ContrepartieKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("contrepartie")
@Data
public class Contrepartie implements Auditable {

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

    @NotNull(message = "L'identifiant du journal comptable ne peut pas être nul")
    private UUID journalComptableId;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Size(max = 255, message = "Créé par ne doit pas dépasser 255 caractères")
    private String createdBy;

    @Size(max = 255, message = "Mis à jour par ne doit pas dépasser 255 caractères")
    private String updatedBy;

    @Override
    public UUID getTenantId() {
        return key.getTenantId();
    }

    @Override
    public void setTenantId(UUID tenantId) {
        if (key == null) {
            key = new ContrepartieKey();
        }
        key.setTenantId(tenantId);
    }
}