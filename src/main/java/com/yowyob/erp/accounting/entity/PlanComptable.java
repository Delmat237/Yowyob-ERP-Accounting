package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.PlanComptableKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.Column;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.redis.core.RedisHash;

//@RedisHash("plan_comptable")
@Table("plan_comptable")
@Data
public class PlanComptable implements Auditable {

    private UUID id;

    @PrimaryKey
    private PlanComptableKey key;

    @NotBlank(message = "Le numéro de compte ne peut pas être vide")
    @Size(max = 20, message = "Le numéro de compte ne doit pas dépasser 20 caractères")
    @Column("no_compte")
    private String noCompte;

    @NotBlank(message = "Le libellé ne peut pas être vide")
    @Size(max = 255, message = "Le libellé ne doit pas dépasser 255 caractères")
    private String libelle;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    @NotNull(message = "Le statut actif ne peut pas être nul")
    private Boolean actif = true;

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

    private Integer classe;
    
    @Override
    public UUID getTenantId() {
        return key.getTenantId();
    }

    @Override
    public void setTenantId(UUID tenantId) {
        if (key == null) {
            key = new PlanComptableKey();
        }
        key.setTenantId(tenantId);
    }
}