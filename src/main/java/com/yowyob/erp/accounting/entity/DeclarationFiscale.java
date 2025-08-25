package com.yowyob.erp.accounting.entity;

import com.yowyob.erp.accounting.entityKey.DeclarationFiscaleKey;
import com.yowyob.erp.common.entity.Auditable;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.mapping.Column;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

//import org.springframework.data.redis.core.RedisHash;

//@RedisHash("declaration_fiscale")
@Table("declaration_fiscale")
@Data
public class DeclarationFiscale implements Auditable {

    @PrimaryKey
    private DeclarationFiscaleKey key;

    @NotBlank(message = "Le type de déclaration ne peut pas être vide")
    @Size(max = 50, message = "Le type de déclaration ne doit pas dépasser 50 caractères")
    @Column("type_declaration")
    private String typeDeclaration;

    @NotNull(message = "La période de début ne peut pas être nulle")
    @Column("periode_debut")
    private LocalDate periodeDebut;

    @Column
    @NotNull(message = "La période de fin ne peut pas être nulle")
    private LocalDate periodeFin;

    @Column("montant_total")
    @NotNull(message = "Le montant total ne peut pas être nul")
    @PositiveOrZero(message = "Le montant total doit être positif ou zéro")
    private Double montantTotal;

    @NotNull(message = "La date de génération ne peut pas être nulle")
   @Column("date_generation")
    private LocalDate dateGeneration;

    @NotBlank(message = "Le statut ne peut pas être vide")
    @Pattern(regexp = "DRAFT|SUBMITTED|VALIDATED", message = "Le statut doit être DRAFT, SUBMITTED ou VALIDATED")
    private String statut;

    @Size(max = 100, message = "Le numéro de déclaration ne doit pas dépasser 100 caractères")
    @Column("numero_declaration")
    private String numeroDeclaration;

    @Column("donnees_declaration")
    private String donneesDeclaration;

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
            key = new DeclarationFiscaleKey();
        }
        key.setTenantId(tenantId);
    }
}