// Contrôleur pour les écritures comptables
package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.dto.EcritureComptableDto;
import com.yowyob.erp.accounting.service.EcritureComptableService;
import com.yowyob.erp.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounting/entries")
@RequiredArgsConstructor
@Tag(name = "Écritures Comptables", description = "Gestion des écritures comptables")
public class EcritureComptableController {

    private final EcritureComptableService ecritureService;

    @Operation(summary = "Créer une nouvelle écriture comptable", 
               description = "Saisie manuelle d'une écriture comptable")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponse<EcritureComptableDto>> createEcriture(
            @Valid @RequestBody EcritureComptableDto ecritureDto) {
        
        EcritureComptableDto created = ecritureService.createEcriture(ecritureDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Écriture comptable créée avec succès"));
    }

    @Operation(summary = "Valider une écriture comptable")
    @PostMapping("/{id}/validate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponse<EcritureComptableDto>> validateEcriture(
            @PathVariable Long id,
            Authentication authentication) {
        
        EcritureComptableDto validated = ecritureService.validateEcriture(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(validated, "Écriture comptable validée"));
    }

    @Operation(summary = "Récupérer toutes les écritures comptables avec pagination")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<Page<EcritureComptableDto>>> getAllEcritures(Pageable pageable) {
        Page<EcritureComptableDto> ecritures = ecritureService.getAllEcritures(pageable);
        return ResponseEntity.ok(ApiResponse.success(ecritures));
    }

    @Operation(summary = "Récupérer les écritures non validées")
    @GetMapping("/non-validated")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<EcritureComptableDto>>> getNonValidatedEcritures() {
        List<EcritureComptableDto> ecritures = ecritureService.getNonValidatedEcritures();
        return ResponseEntity.ok(ApiResponse.success(ecritures));
    }

    @Operation(summary = "Rechercher des écritures comptables")
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<List<EcritureComptableDto>>> searchEcritures(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long journalId) {
        
        List<EcritureComptableDto> ecritures = ecritureService.searchEcritures(startDate, endDate, journalId);
        return ResponseEntity.ok(ApiResponse.success(ecritures));
    }

    @Operation(summary = "Générer automatiquement une écriture à partir d'une transaction")
    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponse<EcritureComptableDto>> generateAutomaticEntry(
            @RequestParam Long transactionId,
            @RequestParam Long operationId) {
        
        EcritureComptableDto generated = ecritureService.generateAutomaticEntry(transactionId, operationId);
        return ResponseEntity.ok(ApiResponse.success(generated, "Écriture générée automatiquement"));
    }
}
