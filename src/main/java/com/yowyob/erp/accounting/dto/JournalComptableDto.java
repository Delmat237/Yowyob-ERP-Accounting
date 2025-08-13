// DTO pour les journaux comptables
package com.yowyob.erp.accounting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalComptableDto {

    private UUID id;

    @NotBlank(message = "Le code journal est obligatoire")
    private String codeJournal;

    @NotBlank(message = "Le libellé est obligatoire")
    private String libelle;

    @NotBlank(message = "Le type de journal est obligatoire")
    private String typeJournal;

    private String notes;

    private Boolean actif = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}