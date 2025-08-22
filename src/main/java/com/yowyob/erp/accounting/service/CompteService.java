package com.yowyob.erp.accounting.service;

import com.yowyob.erp.accounting.entity.Compte;
import com.yowyob.erp.accounting.entityKey.CompteKey;
import com.yowyob.erp.accounting.repository.CompteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CompteService {

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    private static final String CACHE_PREFIX = "compte:solde:";
    private static final String CACHE_ALL_PREFIX = "compte:all:";
    private static final String CACHE_BY_NO_COMPTE_PREFIX = "compte:nocompte:";

    @Transactional
    public Compte createCompte(Compte compte) {
        // Initialise les champs d'audit et calcule le solde initial (si applicable)
        CompteKey key = new CompteKey();
        key.setTenantId(compte.getKey().getTenantId());
        key.setId(UUID.randomUUID());
        compte.setKey(key);
        compte.setCreatedAt(LocalDateTime.now());
        compte.setUpdatedAt(LocalDateTime.now());
        compte.setCreatedBy("system"); // À remplacer par l'utilisateur authentifié
        compte.setUpdatedBy("system");
        compte.setSoldes(BigDecimal.ZERO); // Solde initial par défaut

        Compte savedCompte = compteRepository.save(compte);
        // Mise à jour du cache Redis pour le solde
        redisTemplate.opsForValue().set(CACHE_PREFIX + savedCompte.getKey().getTenantId() + ":" + savedCompte.getKey().getId(),
                savedCompte.getSoldes());
        // Invalide le cache global et par numéro de compte
        redisTemplate.delete(CACHE_ALL_PREFIX + savedCompte.getKey().getTenantId());
        redisTemplate.delete(CACHE_BY_NO_COMPTE_PREFIX + savedCompte.getKey().getTenantId() + ":" + savedCompte.getNoCompte());

        return savedCompte;
    }

    public List<Compte> findAllByTenantId(UUID tenantId) {
        // Clé de cache pour tous les comptes d'un tenant
        String cacheKey = CACHE_ALL_PREFIX + tenantId;
        List<Compte> comptes = (List<Compte>) redisTemplate.opsForValue().get(cacheKey);

        if (comptes == null) {
            comptes = compteRepository.findAllByKeyTenantId(tenantId);
            if (!comptes.isEmpty()) {
                redisTemplate.opsForValue().set(cacheKey, comptes);
            }
        }
        return comptes != null ? comptes : List.of();
    }

    public Optional<Compte> findById(UUID tenantId, UUID id) {
        String cacheKey = CACHE_PREFIX + tenantId + ":" + id;
        Object cachedSolde = redisTemplate.opsForValue().get(cacheKey);

        CompteKey key = new CompteKey();
        key.setTenantId(tenantId);
        key.setId(id);

        if (cachedSolde != null && cachedSolde instanceof BigDecimal) {
            // Si le solde est en cache, on le retourne directement
            Compte compte = compteRepository.findByKey(key).orElse(null);
            if (compte != null) compte.setSoldes((BigDecimal) cachedSolde);
            return Optional.ofNullable(compte);
        }

        // Récupère un compte par ID et tenant
        Optional<Compte> compteOpt = compteRepository.findByKey(key);
        compteOpt.ifPresent(compte -> {
            // Met à jour le cache Redis
            redisTemplate.opsForValue().set(cacheKey, compte.getSoldes());
        });
        return compteOpt;
    }

    public List<Compte> findByNoCompte(UUID tenantId, String noCompte) {
        // Clé de cache pour les comptes par numéro de compte
        String cacheKey = CACHE_BY_NO_COMPTE_PREFIX + tenantId + ":" + noCompte;
        List<Compte> comptes = (List<Compte>) redisTemplate.opsForValue().get(cacheKey);

        if (comptes == null) {
            comptes = compteRepository.findByKeyTenantIdAndNoCompte(tenantId, noCompte)
                    .map(List::of)
                    .orElse(List.of());
            if (!comptes.isEmpty()) {
                redisTemplate.opsForValue().set(cacheKey, comptes);
            }
        }
        return comptes;
    }

    @Transactional
    public Compte updateCompte(Compte compte) {
        // Met à jour les champs d'audit et persiste
        compte.setUpdatedAt(LocalDateTime.now());
        compte.setUpdatedBy("system");
        Compte updatedCompte = compteRepository.save(compte);

        // Mise à jour du cache Redis pour le solde
        redisTemplate.opsForValue().set(CACHE_PREFIX + updatedCompte.getKey().getTenantId() + ":" + updatedCompte.getKey().getId(),
                updatedCompte.getSoldes());
        // Invalide le cache global et par numéro de compte
        redisTemplate.delete(CACHE_ALL_PREFIX + updatedCompte.getKey().getTenantId());
        redisTemplate.delete(CACHE_BY_NO_COMPTE_PREFIX + updatedCompte.getKey().getTenantId() + ":" + updatedCompte.getNoCompte());

        return updatedCompte;
    }

    @Transactional
    public void deleteById(UUID tenantId, UUID id) {
        // Supprime un compte par ID et tenant
        CompteKey key = new CompteKey();
        key.setTenantId(tenantId);
        key.setId(id);
        Optional<Compte> compteOpt = compteRepository.findByKey(key);
        compteOpt.ifPresent(compte -> {
            // Invalide tous les caches liés à ce compte
            redisTemplate.delete(CACHE_PREFIX + tenantId + ":" + id);
            redisTemplate.delete(CACHE_ALL_PREFIX + tenantId);
            redisTemplate.delete(CACHE_BY_NO_COMPTE_PREFIX + tenantId + ":" + compte.getNoCompte());
        });
        compteRepository.deleteById(key);
    }
}