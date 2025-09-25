package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.PlanComptable;
import com.yowyob.erp.accounting.entityKey.PlanComptableKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface PlanComptableRepository extends CassandraRepository<PlanComptable, PlanComptableKey> {

    List<PlanComptable> findAllByKeyTenantId(UUID tenantId);

    Optional<PlanComptable> findByKey(PlanComptableKey key);
    Optional<PlanComptable> findByKeyTenantIdAndKeyId(UUID tenantId, UUID infod);

    boolean existsByKeyTenantIdAndNoCompte(UUID tenantId, String noCompte);

    Optional<PlanComptable> findByKeyTenantIdAndNoCompte(UUID tenantId, String noCompte);

    List<PlanComptable> findByKeyTenantIdAndActifTrue(UUID tenantId);

    @Query("SELECT * FROM plan_comptable WHERE tenant_id = ?0 AND no_compte LIKE ?1%")
    List<PlanComptable> findByKeyTenantIdAndNoComptePrefix(UUID tenantId, String prefix);

    List<PlanComptable> findByKeyTenantIdAndClasse(UUID tenantId, Integer classe);
}