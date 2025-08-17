package com.yowyob.erp.accounting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.Column;

import com.yowyob.erp.accounting.entityKey.CompteKey;
import com.yowyob.erp.common.entity.Auditable;

import jakarta.validation.constraints.*;
import lombok.Data;

import org.springframework.data.redis.core.RedisHash;

//@RedisHash("compte")
@Table("compte")
@Data
public class Compte  implements Auditable {

    private UUID id;

    @PrimaryKey
    private CompteKey key;

    @NotBlank(message = "Le numéro de compte ne peut pas être vide")
    @Size(max = 20, message = "Le numéro de compte ne doit pas dépasser 20 caractères")
    @Column("no_compte")
    private String noCompte;

    @NotBlank(message = "Le libellé ne peut pas être vide")
    @Size(max = 255, message = "Le libellé ne doit pas dépasser 255 caractères")
    private String libelle;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    
    private Integer soldes;
    @NotNull(message = "Le statut actif ne peut pas être nul")
    private Boolean actif = true;

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
            key = new CompteKey();
        }
        key.setTenantId(tenantId);
    }
}