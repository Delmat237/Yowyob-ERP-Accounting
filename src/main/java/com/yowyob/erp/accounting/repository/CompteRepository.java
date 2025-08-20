package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.Compte;
import com.yowyob.erp.accounting.entityKey.CompteKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface CompteRepository extends CassandraRepository<Compte, CompteKey> {

    Optional<Compte> findByKey(CompteKey key);

    boolean existsByKeyTenantIdAndNoCompte(UUID tenantId, String noCompte);

    Optional<Compte> findByKeyTenantIdAndNoCompte(UUID tenantId, String noCompte);

    List<Compte> findByKeyTenantIdAndActifTrue(UUID tenantId);

    @Query("SELECT * FROM plan_comptable WHERE tenant_id = ?0 AND no_compte LIKE ?1%")
    List<Compte> findByKeyTenantIdAndNoComptePrefix(UUID tenantId, String prefix);

    List<Compte> findByKeyTenantIdAndClasse(UUID tenantId, Integer classe);
}