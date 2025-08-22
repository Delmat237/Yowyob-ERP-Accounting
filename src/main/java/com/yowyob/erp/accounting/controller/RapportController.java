package com.yowyob.erp.accounting.controller;

import com.yowyob.erp.accounting.service.RapportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/rapport")
public class RapportController {

    @Autowired
    private RapportService rapportService;

    @GetMapping("/bilan")
    public ResponseEntity<Map<String, Object>> generateBilan(@RequestParam UUID tenantId,
                                                            @RequestParam String dateDebut,
                                                            @RequestParam String dateFin) {
        Map<String, Object> bilan = rapportService.generateBilan(tenantId, dateDebut, dateFin);
        return ResponseEntity.ok(bilan);
    }

    @GetMapping("/compte-resultat")
    public ResponseEntity<Map<String, Object>> generateCompteResultat(@RequestParam UUID tenantId,
                                                                     @RequestParam String dateDebut,
                                                                     @RequestParam String dateFin) {
        Map<String, Object> compteResultat = rapportService.generateCompteResultat(tenantId, dateDebut, dateFin);
        return ResponseEntity.ok(compteResultat);
    }
}