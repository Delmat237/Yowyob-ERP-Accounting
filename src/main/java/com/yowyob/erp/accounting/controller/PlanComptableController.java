/ Contrôleur pour le plan comptable
package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.dto.PlanComptableDto;
import com.yowyob.erp.accounting.service.PlanComptableService;
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

@RestController
@RequestMapping("/api/accounting/chart-of-accounts")
@RequiredArgsConstructor
@Tag(name = "Plan Comptable", description = "Gestion du plan comptable OHADA")
public class PlanComptableController {

    private final PlanComptableService planComptableService;

    @Operation(summary = "Créer un nouveau compte", 
               description = "Ajouter un compte au plan comptable OHADA")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlanComptableDto>> createAccount(
            @Valid @RequestBody PlanComptableDto accountDto) {
        
        PlanComptableDto created = planComptableService.createAccount(accountDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Compte créé avec succès"));
    }

    @Operation(summary = "Mettre à jour un compte")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlanComptableDto>> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody PlanComptableDto accountDto) {
        
        PlanComptableDto updated = planComptableService.updateAccount(id, accountDto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Compte mis à jour"));
    }

    @Operation(summary = "Récupérer tous les comptes actifs")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<List<PlanComptableDto>>> getAllAccounts() {
        List<PlanComptableDto> accounts = planComptableService.getAllActiveAccounts();
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @Operation(summary = "Récupérer un compte par ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<PlanComptableDto>> getAccountById(@PathVariable Long id) {
        PlanComptableDto account = planComptableService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @Operation(summary = "Rechercher des comptes par préfixe")
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponse<List<PlanComptableDto>>> searchAccountsByPrefix(
            @RequestParam String prefix) {
        
        List<PlanComptableDto> accounts = planComptableService.getAccountsByPrefix(prefix);
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @Operation(summary = "Désactiver un compte")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(@PathVariable Long id) {
        planComptableService.deactivateAccount(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Compte désactivé"));
    }
}
