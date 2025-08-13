package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.dto.EcritureComptableDto;
import com.yowyob.erp.accounting.service.EcritureComptableService;
import com.yowyob.erp.common.dto.ApiResponseWrapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounting/entries")
@RequiredArgsConstructor
@Tag(name = "Écritures Comptables", description = "Gestion des écritures comptables")
@SecurityRequirement(name = "BasicAuth")
public class EcritureComptableController {

    private final EcritureComptableService ecritureService;

    @Operation(summary = "Créer une nouvelle écriture comptable", description = "Saisie manuelle d'une écriture comptable")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Écriture comptable créée"),
            @ApiResponse(responseCode = "400", description = "Données invalides ou période/journal invalide"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<EcritureComptableDto>> createEcriture(
            @Valid @RequestBody EcritureComptableDto ecritureDto) {
        EcritureComptableDto created = ecritureService.createEcriture(ecritureDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseWrapper.success(created, "Écriture comptable créée avec succès"));
    }

    @Operation(summary = "Valider une écriture comptable", description = "Valide une écriture comptable existante")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Écriture comptable validée"),
            @ApiResponse(responseCode = "400", description = "Écriture déjà validée ou période clôturée"),
            @ApiResponse(responseCode = "404", description = "Écriture non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping("/{id}/validate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<EcritureComptableDto>> validateEcriture(
            @PathVariable UUID id,
            Authentication authentication) {
        EcritureComptableDto validated = ecritureService.validateEcriture(id, authentication.getName());
        return ResponseEntity.ok(ApiResponseWrapper.success(validated, "Écriture comptable validée"));
    }

    @Operation(summary = "Récupérer toutes les écritures comptables avec pagination", description = "Liste paginée des écritures comptables")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des écritures comptables"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<Page<EcritureComptableDto>>> getAllEcritures(Pageable pageable) {
        Page<EcritureComptableDto> ecritures = ecritureService.getAllEcritures(pageable);
        return ResponseEntity.ok(ApiResponseWrapper.success(ecritures));
    }

    @Operation(summary = "Récupérer les écritures non validées", description = "Liste des écritures comptables non validées")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des écritures non validées"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/non-validated")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<List<EcritureComptableDto>>> getNonValidatedEcritures() {
        List<EcritureComptableDto> ecritures = ecritureService.getNonValidatedEcritures();
        return ResponseEntity.ok(ApiResponseWrapper.success(ecritures));
    }

    @Operation(summary = "Rechercher des écritures comptables", description = "Recherche par plage de dates et/ou journal")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des écritures trouvées"),
            @ApiResponse(responseCode = "400", description = "Dates invalides"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<EcritureComptableDto>>> searchEcritures(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) UUID journalId) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.error("La date de début doit être antérieure ou égale à la date de fin"));
        }
        List<EcritureComptableDto> ecritures = ecritureService.searchEcritures(startDate, endDate, journalId);
        return ResponseEntity.ok(ApiResponseWrapper.success(ecritures));
    }

    @Operation(summary = "Générer automatiquement une écriture à partir d'une transaction", description = "Génère une écriture comptable basée sur une transaction et une opération")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Écriture générée"),
            @ApiResponse(responseCode = "400", description = "Transaction ou opération invalide"),
            @ApiResponse(responseCode = "404", description = "Transaction ou opération non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<EcritureComptableDto>> generateAutomaticEntry(
            @RequestParam UUID transactionId,
            @RequestParam UUID operationId) {
        EcritureComptableDto generated = ecritureService.generateAutomaticEntry(transactionId, operationId);
        return ResponseEntity.ok(ApiResponseWrapper.success(generated, "Écriture générée automatiquement"));
    }
}