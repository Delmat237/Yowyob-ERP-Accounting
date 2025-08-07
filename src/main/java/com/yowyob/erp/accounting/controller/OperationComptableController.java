package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.dto.OperationComptableDto;
import com.yowyob.erp.accounting.dto.ContrepartieDto;
import com.yowyob.erp.accounting.service.OperationComptableService;
import com.yowyob.erp.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour la gestion des opérations comptables
 */
@RestController
@RequestMapping("/api/accounting/operations")
@RequiredArgsConstructor
@Tag(name = "Opérations Comptables", description = "Gestion du paramétrage des opérations comptables")
public class OperationComptableController {

    private final OperationComptableService operationService;

    @Operation(summary = "Créer une nouvelle opération comptable", 
               description = "Crée une opération comptable avec ses contreparties")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OperationComptableDto>> createOperation(
            @Valid @RequestBody OperationComptableDto operationDto,
            @RequestBody(required = false) List<ContrepartieDto> contreparties) {
        
        OperationComptableDto created = operationService.createOperation(operationDto, contreparties);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Opération comptable créée avec succès"));
    }

    @Operation(summary = "Mettre à jour une opération comptable")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OperationComptableDto>> updateOperation(
            @PathVariable Long id,
            @Valid @RequestBody OperationComptableDto operationDto) {
        
        OperationComptableDto updated = operationService.updateOperation(id, operationDto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Opération comptable mise à jour"));
    }

    @Operation(summary = "Récupérer toutes les opérations comptables")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<List<OperationComptableDto>>> getAllOperations() {
        List<OperationComptableDto> operations = operationService.getAllOperations();
        return ResponseEntity.ok(ApiResponse.success(operations));
    }

    @Operation(summary = "Récupérer une opération comptable par ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<OperationComptableDto>> getOperationById(@PathVariable Long id) {
        OperationComptableDto operation = operationService.getOperationById(id);
        return ResponseEntity.ok(ApiResponse.success(operation));
    }

    @Operation(summary = "Trouver une opération par type et mode de règlement")
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<OperationComptableDto>> findOperationByTypeAndMode(
            @RequestParam String typeOperation,
            @RequestParam String modeReglement) {
        
        OperationComptableDto operation = operationService.findOperationByTypeAndMode(typeOperation, modeReglement);
        return ResponseEntity.ok(ApiResponse.success(operation));
    }

    @Operation(summary = "Désactiver une opération comptable")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateOperation(@PathVariable Long id) {
        operationService.deactivateOperation(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Opération comptable désactivée"));
    }
}
