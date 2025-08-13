package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.JournalAuditKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("journal_audit")
@Data
public class JournalAudit implements Auditable {

    @PrimaryKey
    private JournalAuditKey key;

    private UUID ecritureComptableId;

    @NotBlank(message = "L'action ne peut pas être vide")
    @Pattern(regexp = "CREATION|VALIDATION|MODIFICATION", message = "L'action doit être CREATION, VALIDATION ou MODIFICATION")
    private String action;

    @NotNull(message = "La date d'action ne peut pas être nulle")
    private LocalDateTime dateAction;

    @NotBlank(message = "L'utilisateur ne peut pas être vide")
    @Size(max = 255, message = "L'utilisateur ne doit pas dépasser 255 caractères")
    private String utilisateur;

    private String details;

    @Size(max = 255, message = "L'adresse IP ne doit pas dépasser 255 caractères")
    private String adresseIP;

    private String donneesAvant;

    private String donneesApres;

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
            key = new JournalAuditKey();
        }
        key.setTenantId(tenantId);
    }
}