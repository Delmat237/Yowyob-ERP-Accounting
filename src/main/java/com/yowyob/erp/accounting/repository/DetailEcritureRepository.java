package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.DetailEcriture;
import com.yowyob.erp.accounting.entityKey.DetailEcritureKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DetailEcritureRepository extends CassandraRepository<DetailEcriture, DetailEcritureKey> {

    List<DetailEcriture> findByKeyTenantIdAndKeyEcritureComptableId(UUID tenantId, UUID ecritureComptableId);

    List<DetailEcriture> findByKeyTenantId(UUID tenantId);

    // Requires secondary index on plan_comptable_id
    List<DetailEcriture> findByKeyTenantIdAndCompteComptableId(UUID tenantId, UUID compteComptableId);

    // Balance calculation (application-side for ScyllaDB)
    default Double calculateAccountBalance(UUID tenantId, UUID compteComptableId) {
        List<DetailEcriture> entries = findByKeyTenantIdAndCompteComptableId(tenantId, compteComptableId);
        return entries.stream()
                .mapToDouble(e -> e.getMontantDebit() - e.getMontantCredit())
                .sum();
    }

    // Date range query (requires materialized view)
    @Query("SELECT * FROM detail_ecriture_by_date WHERE tenant_id = :tenantId AND date_ecriture >= :startDate AND date_ecriture <= :endDate")
    List<DetailEcriture> findByTenantIdAndDateRange(UUID tenantId, LocalDateTime startDate, LocalDateTime endDate);
}