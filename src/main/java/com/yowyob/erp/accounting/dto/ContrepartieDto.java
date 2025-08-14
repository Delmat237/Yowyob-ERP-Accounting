// DTO pour les contreparties
package com.yowyob.erp.accounting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContrepartieDto {

    private UUID id;

    @NotNull(message = "L'ID de l'opération comptable est obligatoire")
    private UUID operationComptableId;

    @NotBlank(message = "Le compte est obligatoire")
    private String compte;

    @Builder.Default
    @NotNull(message = "Le statut du compte tiers est obligatoire")
    private Boolean estCompteTiers = false;

    @NotBlank(message = "Le sens est obligatoire")
    private String sens;

    @NotBlank(message = "Le type de montant est obligatoire")
    private String typeMontant;

    @NotNull(message = "Le journal comptable est obligatoire")
    private UUID journalComptableId;

    private String notes;
}