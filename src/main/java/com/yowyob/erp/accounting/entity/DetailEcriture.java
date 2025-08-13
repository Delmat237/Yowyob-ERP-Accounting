package com.yowyob.erp.accounting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import com.yowyob.erp.accounting.entityKey.DetailEcritureKey;
import com.yowyob.erp.common.entity.Auditable;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Table("detail_ecriture")
@Data
public class DetailEcriture implements Auditable {

    @PrimaryKey
    private DetailEcritureKey key;

    @NotNull(message = "L'identifiant du plan comptable ne peut pas être nul")
    private UUID planComptableId;

    /*
    @NotBlank(message = "Le numéro de compte ne peut pas être vide")
    private String noCompte;
    */
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

    private LocalDateTime dateEcriture;
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
            key = new DetailEcritureKey();
        }
        key.setTenantId(tenantId);
    }
}