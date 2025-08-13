// DTO pour les déclarations fiscales
package com.yowyob.erp.accounting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeclarationFiscaleDto {

    private UUID id;

    @NotBlank(message = "Le type de déclaration est obligatoire")
    private String typeDeclaration;

    @NotNull(message = "La période de début est obligatoire")
    private LocalDate periodeDebut;

    @NotNull(message = "La période de fin est obligatoire")
    private LocalDate periodeFin;

    @NotNull(message = "Le montant total est obligatoire")
    private Double montantTotal;

    @NotNull(message = "La date de génération est obligatoire")
    private LocalDate dateGeneration;

    @NotBlank(message = "Le statut est obligatoire")
    private String statut;

    private String numeroDeclaration;

    private String donneesDeclaration;

    private String notes;
}