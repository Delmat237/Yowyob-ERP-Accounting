package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.DeclarationFiscale;
import com.yowyob.erp.accounting.entityKey.DeclarationFiscaleKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeclarationFiscaleRepository extends CassandraRepository<DeclarationFiscale, DeclarationFiscaleKey> {

    List<DeclarationFiscale> findByKeyTenantIdOrderByDateGenerationDesc(UUID tenantId);

    List<DeclarationFiscale> findByKeyTenantIdAndTypeDeclaration(UUID tenantId, String typeDeclaration);

    List<DeclarationFiscale> findByKeyTenantIdAndStatut(UUID tenantId, String statut);

    Optional<DeclarationFiscale> findByKeyTenantIdAndNumeroDeclaration(UUID tenantId, String numeroDeclaration);

    @Query("SELECT * FROM declaration_fiscale WHERE tenant_id = :tenantId AND periode_debut >= :startDate AND periode_fin <= :endDate ALLOW FILTERING")
    List<DeclarationFiscale> findByTenantIdAndPeriodRange(UUID tenantId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COUNT(*) > 0 FROM declaration_fiscale WHERE tenant_id = :tenantId AND numero_declaration = :numeroDeclaration")
    boolean existsByTenantIdAndNumeroDeclaration(UUID tenantId, String numeroDeclaration);
}