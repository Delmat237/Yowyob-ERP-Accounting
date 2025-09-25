package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.dto.OperationComptableDto;
import com.yowyob.erp.accounting.service.OperationComptableService;
import com.yowyob.erp.common.dto.ApiResponseWrapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounting/operation-comptable")
@RequiredArgsConstructor
@Tag(name = "Opérations Comptables", description = "API pour la gestion des opérations comptables")
@SecurityRequirement(name = "BasicAuth")
public class OperationComptableController {

    private final OperationComptableService operationComptableService;

    @Operation(summary = "Créer une opération comptable", description = "Crée une nouvelle opération comptable pour le tenant courant")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Opération comptable créée"),
            @ApiResponse(responseCode = "400", description = "Données invalides ou journal/compte invalide"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<OperationComptableDto>> createOperationComptable(
            @Valid @RequestBody OperationComptableDto dto) {
        OperationComptableDto created = operationComptableService.createOperationComptable(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseWrapper.success(created, "Opération comptable créée avec succès"));
    }

    @Operation(summary = "Récupérer une opération comptable par ID", description = "Récupère une opération comptable par son ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Opération comptable trouvée"),
            @ApiResponse(responseCode = "404", description = "Opération comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<OperationComptableDto>> getOperationComptable(@PathVariable UUID id) {
        return operationComptableService.getOperationComptable(id)
                .map(dto -> ResponseEntity.ok(ApiResponseWrapper.success(dto)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponseWrapper.error("Opération comptable non trouvée")));
    }

    @Operation(summary = "Récupérer les opérations comptables par numéro de compte", description = "Récupère toutes les opérations comptables associées à un numéro de compte (comptePrincipal)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des opérations comptables trouvées"),
            @ApiResponse(responseCode = "400", description = "Compte principal invalide"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/by-no-compte")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<OperationComptableDto>>> getOperationsByNoCompte(@RequestParam String noCompte) {
        List<OperationComptableDto> operations = operationComptableService.getOperationsByNoCompte(noCompte);
        return ResponseEntity.ok(ApiResponseWrapper.success(operations, "Opérations comptables récupérées avec succès"));
    }
    @Operation(summary = "Lister toutes les opérations comptables", description = "Récupère toutes les opérations comptables du tenant courant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des opérations comptables"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<OperationComptableDto>>> getAllOperationsComptables() {
        List<OperationComptableDto> operations = operationComptableService.getAllOperationsComptables();
        return ResponseEntity.ok(ApiResponseWrapper.success(operations));
    }

    @Operation(summary = "Rechercher une opération par type et mode", description = "Récupère une opération comptable par typeOperation et modeReglement")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Opération comptable trouvée"),
            @ApiResponse(responseCode = "404", description = "Opération comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/search")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<OperationComptableDto>> getOperationByTypeAndMode(
            @RequestParam String typeOperation,
            @RequestParam String modeReglement) {
        return operationComptableService.getOperationByTypeAndMode(typeOperation, modeReglement)
                .map(dto -> ResponseEntity.ok(ApiResponseWrapper.success(dto)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponseWrapper.error("Opération comptable non trouvée")));
    }

    @Operation(summary = "Mettre à jour une opération comptable", description = "Met à jour une opération comptable existante")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Opération comptable mise à jour"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "404", description = "Opération comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PutMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<OperationComptableDto>> updateOperationComptable(
            @PathVariable UUID id,
            @Valid @RequestBody OperationComptableDto dto) {
        OperationComptableDto updated = operationComptableService.updateOperationComptable(id, dto);
        return ResponseEntity.ok(ApiResponseWrapper.success(updated, "Opération comptable mise à jour"));
    }

    @Operation(summary = "Supprimer une opération comptable", description = "Supprime une opération comptable par son ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Opération comptable supprimée"),
            @ApiResponse(responseCode = "404", description = "Opération comptable non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @DeleteMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<Void>> deleteOperationComptable(@PathVariable UUID id) {
        operationComptableService.deleteOperationComptable(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ApiResponseWrapper.success(null, "Opération comptable supprimée"));
    }
}