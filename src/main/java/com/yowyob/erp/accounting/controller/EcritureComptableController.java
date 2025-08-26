package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.dto.EcritureComptableDto;
import com.yowyob.erp.accounting.service.EcritureComptableService;
import com.yowyob.erp.common.dto.ApiResponseWrapper;
import com.yowyob.erp.common.dto.ComptableObjectRequest;
import com.yowyob.erp.common.entity.ComptableObject;
import com.yowyob.erp.common.exception.BusinessException;
import com.yowyob.erp.common.exception.ResourceNotFoundException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static com.yowyob.erp.accounting.util.AccountingUtils.mapToComptableObject;

@RestController
@RequestMapping("/api/accounting/entries")
@RequiredArgsConstructor
@Tag(name = "Écritures Comptables", description = "Gestion des écritures comptables")
@SecurityRequirement(name = "BasicAuth")
public class EcritureComptableController {

    private final EcritureComptableService ecritureService;

   @Operation(summary = "Créer une nouvelle écriture comptable", description = "Saisie manuelle d'une écriture comptable avec validation des périodes et journaux.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Écriture comptable créée avec succès",
                    content = @Content(schema = @Schema(implementation = EcritureComptableDto.class))),
            @ApiResponse(responseCode = "400", description = "Données invalides ou période/journal invalide"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping
   //  @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<EcritureComptableDto>> createEcriture(
            @Valid @RequestBody EcritureComptableDto ecritureDto) {
        try{
                EcritureComptableDto created = ecritureService.createEcriture(ecritureDto);
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponseWrapper.success(created, "Écriture comptable créée avec succès"));
        }  catch (Exception e) {
            throw new BusinessException("Données invalides : " + e.getMessage());
        }
    }

  @Operation(summary = "Valider une écriture comptable", description = "Valide une écriture comptable existante avec enregistrement de l'utilisateur validant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Écriture comptable validée avec succès",
                    content = @Content(schema = @Schema(implementation = EcritureComptableDto.class))),
            @ApiResponse(responseCode = "400", description = "Écriture déjà validée ou période clôturée"),
            @ApiResponse(responseCode = "404", description = "Écriture non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @PostMapping("/{id}/validate")
   //  @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<EcritureComptableDto>> validateEcriture(
            @PathVariable UUID id,
            Authentication authentication) {
        EcritureComptableDto validated = ecritureService.validateEcriture(id, authentication.getName());
        return ResponseEntity.ok(ApiResponseWrapper.success(validated, "Écriture comptable validée"));
    }

    @Operation(summary = "Récupérer toutes les écritures comptables", description = "Liste paginée des écritures comptables")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des écritures comptables"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping
   //  @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
    public ResponseEntity<ApiResponseWrapper<List<EcritureComptableDto>>> getAllEcritures( ) {
        List<EcritureComptableDto> ecritures = ecritureService.getAllEcritures(); 
        return ResponseEntity.ok(ApiResponseWrapper.success(ecritures));
    }

   @Operation(summary = "Récupérer les écritures non validées", description = "Liste paginée des écritures comptables non validées pour l'utilisateur courant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des écritures non validées",
                    content = @Content(schema = @Schema(implementation = EcritureComptableDto.class))),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/non-validated")
   //  @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<List<EcritureComptableDto>>> getNonValidatedEcritures( ) {
        List<EcritureComptableDto> ecritures = ecritureService.getNonValidatedEcritures(); 
        return ResponseEntity.ok(ApiResponseWrapper.success(ecritures));
    }

  @Operation(summary = "Rechercher des écritures comptables", description = "Recherche par plage de dates et/ou journal avec pagination implicite.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des écritures trouvées",
                    content = @Content(schema = @Schema(implementation = EcritureComptableDto.class))),
            @ApiResponse(responseCode = "400", description = "Dates invalides"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @GetMapping("/search")
   //  @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT') or hasRole('USER')")
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

   @Operation(summary = "Générer automatiquement une écriture à partir d'un objet comptable", 
               description = "Génère une écriture comptable basée sur un objet comptable (transaction, facture, mouvement de stock) avec validation.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Écriture générée avec succès",
                    content = @Content(schema = @Schema(implementation = EcritureComptableDto.class))),
            @ApiResponse(responseCode = "400", description = "Objet comptable invalide"),
            @ApiResponse(responseCode = "404", description = "Objet comptable non trouvé"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
   @PostMapping("/generate-from-object")
        //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
        public ResponseEntity<ApiResponseWrapper<EcritureComptableDto>> generateFromComptableObject(
                @RequestBody ComptableObjectRequest request) {
       try {
            if (request.getTenantId() == null || request.getJournalComptableId() == null) {
                throw new BusinessException("Tenant ID et Journal comptable ID sont requis");
            }
            ComptableObject object = mapToComptableObject(request);
            EcritureComptableDto generated = ecritureService.generateFromComptableObject(object);
            return ResponseEntity.ok(ApiResponseWrapper.success(generated, "Écriture générée avec succès"));
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Données invalides : " + e.getMessage());
        }
        }

@Operation(summary = "Supprimer une écriture comptable", description = "Supprime une écriture comptable (seulement si non validée).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Écriture supprimée avec succès"),
            @ApiResponse(responseCode = "400", description = "Écriture déjà validée ou erreur de suppression"),
            @ApiResponse(responseCode = "404", description = "Écriture non trouvée"),
            @ApiResponse(responseCode = "401", description = "Non autorisé"),
            @ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    @DeleteMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ApiResponseWrapper<Void>> deleteEcriture(@PathVariable UUID id) {
        try {
            ecritureService.deleteEcriture(id);
            return ResponseEntity.ok(ApiResponseWrapper.success(null, "Écriture supprimée avec succès"));
        } catch (IllegalStateException e) {
            throw new BusinessException("Écriture déjà validée ou erreur : " + e.getMessage());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Écriture non trouvée avec ID : " + id);
        }
    }
}