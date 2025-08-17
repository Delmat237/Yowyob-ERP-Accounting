package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.TenantKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.Column;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("tenants")
@Data
public class Tenant implements Auditable {

    @PrimaryKey
    private TenantKey key;

    @NotBlank(message = "Le nom ne peut pas être vide")
    @Size(max = 255, message = "Le nom ne doit pas dépasser 255 caractères")
    private String name;

    @NotBlank(message = "Le nom légal ne peut pas être vide")
    @Size(max = 255, message = "Le nom légal ne doit pas dépasser 255 caractères")
    @Column("legal_name")
    private String legalName;

    @Size(max = 100, message = "Le numéro d'enregistrement ne doit pas dépasser 100 caractères")
    @Column("registration_number")
    private String registrationNumber;

    @Size(max = 100, message = "L'identifiant fiscal ne doit pas dépasser 100 caractères")
    @Column("tax_id")
    private String taxId;

    @Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    private String address;

    @Pattern(regexp = "\\+?[0-9\\-\\s]{10,20}", message = "Le numéro de téléphone est invalide")
    private String phone;

    @Email(message = "L'email doit être valide")
    @Size(max = 255, message = "L'email ne doit pas dépasser 255 caractères")
    private String email;

    @NotBlank(message = "La devise ne peut pas être vide")
    @Size(max = 3, message = "La devise doit être un code ISO de 3 caractères")
    private String currency;

    @NotNull(message = "Le statut actif ne peut pas être nul")
    @Column("is_active")
    private Boolean isActive;

    @NotBlank(message = "Le code comptable ne peut pas être vide")
    @Size(max = 100, message = "Le code comptable ne doit pas dépasser 100 caractères")
    @Column("accounting_code")
    private String accountingCode;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Size(max = 255, message = "Créé par ne doit pas dépasser 255 caractères")
    @Column("created_by")
    private String createdBy;

    @Size(max = 255, message = "Mis à jour par ne doit pas dépasser 255 caractères")
    @Column("updated_by")
    private String updatedBy;

    @Override
    public UUID getTenantId() {
        return key.getTenantId();
    }

    @Override
    public void setTenantId(UUID tenantId) {
        if (key == null) {
            key = new TenantKey();
        }
        key.setTenantId(tenantId);
    }
}

