package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.entity.Compte;
import com.yowyob.erp.accounting.entity.EcritureComptable;
import com.yowyob.erp.accounting.repository.CompteRepository;
import com.yowyob.erp.accounting.repository.EcritureComptableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RapportService {

    @Autowired
    private CompteRepository compteRepository;
    @Autowired
    private EcritureComptableRepository ecritureComptableRepository;

    public Map<String, Object> generateBilan(UUID tenantId, String dateDebut, String dateFin) {
        LocalDate start = LocalDate.parse(dateDebut, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(dateFin, DateTimeFormatter.ISO_LOCAL_DATE);

        Map<String, Object> bilan = new HashMap<>();
        List<Compte> comptes = compteRepository.findAllByKeyTenantId(tenantId);
        BigDecimal totalActif = BigDecimal.ZERO;
        BigDecimal totalPassif = BigDecimal.ZERO;
/* 
        for (Compte compte : comptes) {
            List<EcritureComptable> ecritures = ecritureComptableRepository.findByKeyTenantIdAndCompteId(tenantId, compte.getKey().getId())
                    .stream()
                    .filter(e -> e.getDateOperation().toInstant().isAfter(start.atStartOfDay().toInstant(Instant.now().getOffset()))
                            && e.getDateOperation().toInstant().isBefore(end.atStartOfDay().toInstant(Instant.now().getOffset())))
                    .collect(Collectors.toList());

            BigDecimal solde = ecritures.stream()
                    .map(e -> "D".equals(e.getType()) ? e.getMontant() : e.getMontant().negate())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (compte.getTypeCompte() != null && compte.getTypeCompte().startsWith("Actif")) {
                totalActif = totalActif.add(solde);
            } else if (compte.getTypeCompte() != null && compte.getTypeCompte().startsWith("Passif")) {
                totalPassif = totalPassif.add(solde);
            }
        }
*/
        bilan.put("totalActif", totalActif);
        bilan.put("totalPassif", totalPassif);
        return bilan;
    }

    public Map<String, Object> generateCompteResultat(UUID tenantId, String dateDebut, String dateFin) {
        LocalDate start = LocalDate.parse(dateDebut, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(dateFin, DateTimeFormatter.ISO_LOCAL_DATE);

        Map<String, Object> compteResultat = new HashMap<>();
        List<Compte> comptes = compteRepository.findAllByKeyTenantId(tenantId);
        BigDecimal totalCharges = BigDecimal.ZERO;
        BigDecimal totalProduits = BigDecimal.ZERO;

       /* 
       for (Compte compte : comptes) {
            List<EcritureComptable> ecritures = ecritureComptableRepository.findByKeyTenantIdAndCompteId(tenantId, compte.getKey().getId())
                    .stream()
                    .filter(e -> e.getDateOperation().toInstant().isAfter(start.atStartOfDay().toInstant(Instant.now().getOffset()))
                            && e.getDateOperation().toInstant().isBefore(end.atStartOfDay().toInstant(Instant.now().getOffset())))
                    .collect(Collectors.toList());

            BigDecimal solde = ecritures.stream()
                    .map(e -> "D".equals(e.getType()) ? e.getMontant() : e.getMontant().negate())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
    
            if (compte.getTypeCompte() != null && compte.getTypeCompte().startsWith("Charge")) {
                totalCharges = totalCharges.add(solde.abs());
            } else if (compte.getTypeCompte() != null && compte.getTypeCompte().startsWith("Produit")) {
                totalProduits = totalProduits.add(solde.abs());
            }
        }
   */
        compteResultat.put("totalCharges", totalCharges);
        compteResultat.put("totalProduits", totalProduits);
        compteResultat.put("resultat", totalProduits.subtract(totalCharges));
        return compteResultat;
    }
}