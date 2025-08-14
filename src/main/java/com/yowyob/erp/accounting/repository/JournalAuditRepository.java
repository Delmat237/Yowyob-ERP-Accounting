package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.JournalAudit;
import com.yowyob.erp.accounting.entityKey.JournalAuditKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface JournalAuditRepository extends CassandraRepository<JournalAudit, JournalAuditKey> {

    List<JournalAudit> findByKeyTenantIdOrderByDateActionDesc(UUID tenantId);

    List<JournalAudit> findByKeyTenantIdAndUtilisateur(UUID tenantId, String utilisateur);

    List<JournalAudit> findByKeyTenantIdAndAction(UUID tenantId, String action);

    List<JournalAudit> findByKeyTenantIdAndDateAction(UUID tenantId, LocalDateTime startDate, LocalDateTime endDate);

    List<JournalAudit> findByKeyTenantIdAndEcritureComptableId(UUID tenantId, UUID ecritureComptableId);
}