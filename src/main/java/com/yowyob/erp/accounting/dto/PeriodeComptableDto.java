package com.yowyob.erp.accounting.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PeriodeComptableDto {

    private UUID id;

    @NotBlank(message = "Le code ne peut pas être vide")
    @Size(max = 50, message = "Le code ne doit pas dépasser 50 caractères")
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Le code doit être au format YYYY-MM")
    private String code;

    @NotNull(message = "La date de début ne peut pas être nulle")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin ne peut pas être nulle")
    private LocalDate dateFin;

    @NotNull(message = "Le statut clôturé ne peut pas être nul")
    private Boolean cloturee;

    private LocalDate dateCloture;

    @Size(max = 255, message = "Les notes ne doivent pas dépasser 255 caractères")
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}