package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.Column;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.redis.core.RedisHash;

//@RedisHash("journal_audit")
@Table("journal_audit")
@Data
public class JournalAudit implements Auditable {

    @PrimaryKey
    private JournalAuditKey key;

    @Column("ecriture_comptable_id")
    private UUID ecritureComptableId;

    @NotBlank(message = "L'action ne peut pas être vide")
    @Pattern(regexp = "CREATION|VALIDATION|MODIFICATION", message = "L'action doit être CREATION, VALIDATION ou MODIFICATION")
    private String action;

    @NotNull(message = "La date d'action ne peut pas être nulle")
    @Column
    private LocalDateTime dateAction;

    @NotBlank(message = "L'utilisateur ne peut pas être vide")
    @Size(max = 255, message = "L'utilisateur ne doit pas dépasser 255 caractères")
    private String utilisateur;

    private String details;

    @Size(max = 255, message = "L'adresse IP ne doit pas dépasser 255 caractères")
    @Column("adresse_ip")
    private String adresseIP;

    @Column("donnees_avant")
    private String donneesAvant;

    @Column("donnees_apres")
    private String donneesApres;

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
            key = new JournalAuditKey();
        }
        key.setTenantId(tenantId);
    }
}