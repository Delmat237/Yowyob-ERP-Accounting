package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.ContrepartieKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.Column;

import java.time.LocalDateTime;
import java.util.UUID;

//import org.springframework.data.redis.core.RedisHash;

//@RedisHash("contrepartie")
@Table("contrepartie")
@Data
public class Contrepartie implements Auditable {

    @PrimaryKey
    private ContrepartieKey key;

    @NotBlank(message = "Le compte ne peut pas être vide")
    @Size(max = 20, message = "Le compte ne doit pas dépasser 20 caractères")
    private String compte;

     @Column("operation_comptable_id")
    private UUID operationComptableId;

    @NotNull(message = "Est compte tiers ne peut pas être null")
    private Boolean estCompteTiers = false;

    @NotBlank(message = "Le sens ne peut pas être vide")
    @Pattern(regexp = "DEBIT|CREDIT", message = "Le sens doit être DEBIT ou CREDIT")
    private String sens;

    @NotBlank(message = "Le type de montant ne peut pas être vide")
    @Pattern(regexp = "HT|TTC|TVA|PAU", message = "Le type de montant doit être HT, TTC, TVA ou PAU")
    @Column("type_montant")
    private String typeMontant;

    @NotNull(message = "L'identifiant du journal comptable ne peut pas être nul")
    @Column("journal_comptable_id")
    private UUID journalComptableId;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

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
            key = new ContrepartieKey();
        }
        key.setTenantId(tenantId);
    }
}