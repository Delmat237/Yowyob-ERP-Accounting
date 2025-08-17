package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.EcritureComptable;
import com.yowyob.erp.accounting.entityKey.EcritureComptableKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface EcritureComptableRepository extends CassandraRepository<EcritureComptable, EcritureComptableKey> {
    List<EcritureComptable> findByKeyTenantId(UUID tenantId);
    Optional<EcritureComptable> findByKeyTenantIdAndKeyId(UUID tenantId, UUID id);
    List<EcritureComptable> findByKeyTenantIdAndValideeFalse(UUID tenantId);

    @Query("SELECT * FROM ecriture_comptable_by_date WHERE tenant_id = :tenantId AND date_ecriture >= :startDate AND date_ecriture <= :endDate")
    List<EcritureComptable> findByKeyTenantIdAndDateEcritureRange(UUID tenantId, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT * FROM ecriture_comptable_by_date WHERE tenant_id = :tenantId AND journal_comptable_id = :journalId AND date_ecriture >= :startDate AND date_ecriture <= :endDate")
    List<EcritureComptable> findByKeyTenantIdAndJournalComptableIdAndDateEcritureRange(UUID tenantId, UUID journalId, LocalDateTime startDate, LocalDateTime endDate);
}