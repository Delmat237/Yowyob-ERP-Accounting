package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.entity.Compte;
import com.yowyob.erp.accounting.entityKey.CompteKey;
import com.yowyob.erp.accounting.service.CompteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/compte")
public class CompteController {

    @Autowired
    private CompteService compteService;

    // Créer un nouveau compte
    @PostMapping
    public ResponseEntity<Compte> createCompte(@RequestBody Compte compte) {
        // Valide et persiste un nouveau compte
        Compte savedCompte = compteService.createCompte(compte);
        return ResponseEntity.ok(savedCompte);
    }

    // Récupérer tous les comptes pour un tenant
    @GetMapping
    public ResponseEntity<List<Compte>> getAllComptes(@RequestParam UUID tenantId) {
        // Récupère la liste des comptes pour un tenant spécifique
        List<Compte> comptes = compteService.findAllByTenantId(tenantId);
        return ResponseEntity.ok(comptes);
    }

    // Récupérer un compte par ID
    @GetMapping("/{id}")
    public ResponseEntity<Compte> getCompteById(@PathVariable UUID id, @RequestParam UUID tenantId) {
        // Récupère un compte spécifique par son ID et tenant
        Compte compte = compteService.findById(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));
        return ResponseEntity.ok(compte);
    }

    // Rechercher un compte par noCompte pour un tenant
    @GetMapping("/by-no-compte")
    public ResponseEntity<List<Compte>> findByNoCompte(@RequestParam UUID tenantId, @RequestParam String noCompte) {
        // Récupère les comptes correspondant à un numéro de compte spécifique
        List<Compte> comptes = compteService.findByNoCompte(tenantId, noCompte);
        return ResponseEntity.ok(comptes);
    }

    // Mettre à jour un compte
    @PutMapping("/{id}")
    public ResponseEntity<Compte> updateCompte(@PathVariable UUID id, @RequestParam UUID tenantId,
                                              @RequestBody Compte compte) {
        // Met à jour les données d'un compte existant
         CompteKey key = new CompteKey();
        key.setTenantId(tenantId);
        key.setId(id);
        compte.setKey(key);
        Compte updatedCompte = compteService.updateCompte(compte);
        return ResponseEntity.ok(updatedCompte);
    }

    // Supprimer un compte
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompte(@PathVariable UUID id, @RequestParam UUID tenantId) {
        // Supprime un compte par son ID et tenant
        compteService.deleteById(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}