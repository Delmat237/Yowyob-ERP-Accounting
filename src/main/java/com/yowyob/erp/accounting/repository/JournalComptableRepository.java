package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.JournalComptable;
import com.yowyob.erp.accounting.entityKey.JournalComptableKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface JournalComptableRepository extends CassandraRepository<JournalComptable, JournalComptableKey> {

    List<JournalComptable> findByKeyTenantId(UUID tenantId);

    List<JournalComptable> findByKeyTenantIdAndActifTrue(UUID tenantId);

    Optional<JournalComptable> findByKeyTenantIdAndKeyId(UUID tenantId, UUID id);

    Optional<JournalComptable> findByKeyTenantIdAndCodeJournal(UUID tenantId, String codeJournal);

    List<JournalComptable> findByKeyTenantIdAndTypeJournal(UUID tenantId, String typeJournal);

    boolean existsByKeyTenantIdAndCodeJournal(UUID tenantId, String codeJournal);

    boolean existsByKeyTenantIdAndKeyId(UUID tenantId, UUID id);
}
