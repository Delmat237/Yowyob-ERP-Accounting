package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.dto.PeriodeComptableDto;
import com.yowyob.erp.accounting.service.PeriodeComptableService;
import com.yowyob.erp.common.dto.ApiResponseWrapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounting/periode-comptable")
@RequiredArgsConstructor
@Tag(name = "Périodes Comptables", description = "API pour la gestion des périodes comptables")
@SecurityRequirement(name = "BasicAuth")
public class PeriodeComptableController {

    private final PeriodeComptableService periodeComptableService;

    @Operation(summary = "Créer une période comptable", description = "Crée une nouvelle période comptable pour le tenant courant")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Période comptable créée"),
            @ApiResponse(responseCode = "400", description = "Données invalides ou période chevauchante"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<PeriodeComptableDto>> createPeriodeComptable(
            @Valid @RequestBody PeriodeComptableDto dto) {
        PeriodeComptableDto created = periodeComptableService.createPeriodeComptable(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseWrapper.success(created, "Période comptable créée avec succès"));
    }

    @Operation(summary = "Récupérer une période comptable par ID", description = "Récupère une période comptable par son ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Période comptable trouvée"),
            @ApiResponse(responseCode = "404", description = "Période comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<PeriodeComptableDto>> getPeriodeComptable(@PathVariable UUID id) {
        return periodeComptableService.getPeriodeComptable(id)
                .map(dto -> ResponseEntity.ok(ApiResponseWrapper.success(dto)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponseWrapper.error("Période comptable non trouvée")));
    }

    @Operation(summary = "Lister toutes les périodes comptables", description = "Récupère toutes les périodes comptables du tenant courant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des périodes comptables"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<PeriodeComptableDto>>> getAllPeriodeComptables() {
        List<PeriodeComptableDto> periodes = periodeComptableService.getAllPeriodeComptables();
        return ResponseEntity.ok(ApiResponseWrapper.success(periodes));
    }

    @Operation(summary = "Récupérer une période par code", description = "Récupère une période comptable par son code")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Période comptable trouvée"),
            @ApiResponse(responseCode = "404", description = "Période comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/code/{code}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<PeriodeComptableDto>> getPeriodeByCode(@PathVariable String code) {
        return periodeComptableService.getPeriodeByCode(code)
                .map(dto -> ResponseEntity.ok(ApiResponseWrapper.success(dto)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponseWrapper.error("Période comptable non trouvée")));
    }

    @Operation(summary = "Récupérer une période par date", description = "Récupère une période comptable contenant la date spécifiée")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Période comptable trouvée"),
            @ApiResponse(responseCode = "404", description = "Période comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/date")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<PeriodeComptableDto>> getPeriodeByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return periodeComptableService.getPeriodeByDate(date)
                .map(dto -> ResponseEntity.ok(ApiResponseWrapper.success(dto)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponseWrapper.error("Période comptable non trouvée")));
    }

    @Operation(summary = "Lister les périodes non clôturées", description = "Récupère toutes les périodes comptables non clôturées")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des périodes non clôturées"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/non-closed")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<PeriodeComptableDto>>> getNonClosedPeriodes() {
        List<PeriodeComptableDto> periodes = periodeComptableService.getNonClosedPeriodes();
        return ResponseEntity.ok(ApiResponseWrapper.success(periodes));
    }

    @Operation(summary = "Lister les périodes dans une plage", description = "Récupère les périodes comptables dans une plage de dates")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des périodes comptables"),
            @ApiResponse(responseCode = "400", description = "Dates invalides"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/range")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<PeriodeComptableDto>>> getPeriodesByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.error("La date de début doit être antérieure ou égale à la date de fin"));
        }
        List<PeriodeComptableDto> periodes = periodeComptableService.getPeriodesByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponseWrapper.success(periodes));
    }

    @Operation(summary = "Mettre à jour une période comptable", description = "Met à jour une période comptable existante")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Période comptable mise à jour"),
            @ApiResponse(responseCode = "400", description = "Données invalides ou période clôturée"),
            @ApiResponse(responseCode = "404", description = "Période comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<PeriodeComptableDto>> updatePeriodeComptable(
            @PathVariable UUID id,
            @Valid @RequestBody PeriodeComptableDto dto) {
        PeriodeComptableDto updated = periodeComptableService.updatePeriodeComptable(id, dto);
        return ResponseEntity.ok(ApiResponseWrapper.success(updated, "Période comptable mise à jour"));
    }

    @Operation(summary = "Clôturer une période comptable", description = "Clôture une période comptable existante")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Période comptable clôturée"),
            @ApiResponse(responseCode = "400", description = "Période déjà clôturée"),
            @ApiResponse(responseCode = "404", description = "Période comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<PeriodeComptableDto>> closePeriodeComptable(@PathVariable UUID id) {
        PeriodeComptableDto closed = periodeComptableService.closePeriodeComptable(id);
        return ResponseEntity.ok(ApiResponseWrapper.success(closed, "Période comptable clôturée"));
    }

    @Operation(summary = "Supprimer une période comptable", description = "Supprime une période comptable par son ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Période comptable supprimée"),
            @ApiResponse(responseCode = "400", description = "Période clôturée ne peut pas être supprimée"),
            @ApiResponse(responseCode = "404", description = "Période comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<Void>> deletePeriodeComptable(@PathVariable UUID id) {
        periodeComptableService.deletePeriodeComptable(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ApiResponseWrapper.success(null, "Période comptable supprimée"));
    }
}