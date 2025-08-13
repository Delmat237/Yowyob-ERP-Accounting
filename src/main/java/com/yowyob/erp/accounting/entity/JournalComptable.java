package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.JournalComptableKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("journal_comptable")
@Data
public class JournalComptable implements Auditable {

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
            key = new JournalComptableKey();
        }
        key.setTenantId(tenantId);
    }
}