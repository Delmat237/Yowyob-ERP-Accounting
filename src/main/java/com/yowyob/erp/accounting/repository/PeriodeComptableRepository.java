package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.PeriodeComptable;
import com.yowyob.erp.accounting.entityKey.PeriodeComptableKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface PeriodeComptableRepository extends CassandraRepository<PeriodeComptable, PeriodeComptableKey> {

    List<PeriodeComptable> findByKeyTenantIdOrderByDateDebutDesc(UUID tenantId);

    Optional<PeriodeComptable> findByKeyTenantIdAndCode(UUID tenantId, String code);

    Optional<PeriodeComptable> findByKeyTenantIdAndKeyId(UUID tenantId, UUID periodeComptableId);    

    @Query("SELECT * FROM periode_comptable WHERE tenant_id = :tenantId AND date_debut <= :date AND date_fin >= :date ALLOW FILTERING")
    Optional<PeriodeComptable> findByTenantIdAndDateInRange(UUID tenantId, LocalDate date);

    List<PeriodeComptable> findByKeyTenantIdAndClotureeFalse(UUID tenantId);

    List<PeriodeComptable> findByKeyTenantId(UUID tenantId);


    @Query("SELECT * FROM periode_comptable WHERE tenant_id = :tenantId AND date_debut >= :startDate AND date_fin <= :endDate ALLOW FILTERING")
    List<PeriodeComptable> findByTenantIdAndPeriodRange(UUID tenantId, LocalDate startDate, LocalDate endDate);
}