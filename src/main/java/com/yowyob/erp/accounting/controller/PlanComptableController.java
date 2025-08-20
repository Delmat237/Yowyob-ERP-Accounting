package com.yowyob.erp.accounting.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yowyob.erp.accounting.dto.PlanComptableDto;
import com.yowyob.erp.accounting.dto.PlanComptableDto;
import com.yowyob.erp.accounting.service.PlanComptableService;
import com.yowyob.erp.common.dto.ApiResponseWrapper;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/accounting/plan-comptable")
@RequiredArgsConstructor
@Tag(name = "Plan Comptable", description = "API pour la gestion du plan comptable")
//@SecurityRequirement(name = "BasicAuth")
public class PlanComptableController {

    private final PlanComptableService planComptableService;

    @Operation(summary = "Créer un compte comptable", description = "Crée un nouveau compte comptable pour le tenant courant")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "PlanComptable comptable créé"),
            @ApiResponse(responseCode = "400", description = "Données invalides ou compte existant"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping
   // @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<PlanComptableDto>> createPlanComptable(
            @Valid @RequestBody PlanComptableDto dto) {
        PlanComptableDto created = planComptableService.createAccount(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseWrapper.success(created, "PlanComptable comptable créé avec succès"));
    }

    @Operation(summary = "Récupérer un compte comptable par ID", description = "Récupère un compte comptable par son identifiant UUID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compte comptable trouvé"),
            @ApiResponse(responseCode = "404", description = "Compte comptable non trouvé"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/{id}")
   // @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<PlanComptableDto>> getAccountById(@PathVariable UUID id) {
        PlanComptableDto dto = planComptableService.getAccountById(id);
        return ResponseEntity.ok(ApiResponseWrapper.success(dto));
    }

    @Operation(summary = "Lister tous les comptes comptables actifs", description = "Récupère tous les comptes comptables actifs du tenant courant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des comptes comptables"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<PlanComptableDto>>> getAllPlanComptables() {
        List<PlanComptableDto> accounts = planComptableService.getAllActiveAccounts();
        return ResponseEntity.ok(ApiResponseWrapper.success(accounts));
    }

    @Operation(summary = "Lister les comptes par préfixe", description = "Récupère les comptes comptables commençant par un préfixe donné")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des comptes comptables"),
            @ApiResponse(responseCode = "400", description = "Préfixe invalide"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/prefix/{prefix}")
   // @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<PlanComptableDto>>> getPlanComptablesByPrefix(@PathVariable String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.error("Le préfixe ne peut pas être vide"));
        }
        List<PlanComptableDto> accounts = planComptableService.getAccountsByPrefix(prefix);
        return ResponseEntity.ok(ApiResponseWrapper.success(accounts));
    }

    
    
    @Operation(summary = "Lister les comptes par classe", description = "Récupère les comptes comptables pour une classe donnée")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des comptes comptables"),
            @ApiResponse(responseCode = "400", description = "Classe invalide"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/classe/{classe}")
   // @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<PlanComptableDto>>> getPlanComptablesByClasse(@PathVariable Integer classe) {
        if (classe < 1 || classe > 7) {
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.error("La classe doit être entre 1 et 7"));
        }
        List<PlanComptableDto> accounts = planComptableService.getPlanComptablesByClasse(classe);
        return ResponseEntity.ok(ApiResponseWrapper.success(accounts));
    }


    @Operation(summary = "Mettre à jour un compte comptable", description = "Met à jour un compte comptable existant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PlanComptable comptable mis à jour"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "404", description = "PlanComptable comptable non trouvé"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PutMapping("/{id}")
   // @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<PlanComptableDto>> updatePlanComptable(
            @PathVariable UUID id,
            @Valid @RequestBody PlanComptableDto dto) {
        PlanComptableDto updated = planComptableService.updateAccount(id, dto);
        return ResponseEntity.ok(ApiResponseWrapper.success(updated, "PlanComptable comptable mis à jour"));
    }

    @Operation(summary = "Désactiver un compte comptable", description = "Désactive un compte comptable par son identifiant UUID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "PlanComptable comptable désactivé"),
            @ApiResponse(responseCode = "404", description = "PlanComptable comptable non trouvé"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @DeleteMapping("/{id}")
   // @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<Void>> deactivatePlanComptable(@PathVariable UUID id) {
        planComptableService.deactivateAccount(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ApiResponseWrapper.success(null, "PlanComptable comptable désactivé"));
    }
}