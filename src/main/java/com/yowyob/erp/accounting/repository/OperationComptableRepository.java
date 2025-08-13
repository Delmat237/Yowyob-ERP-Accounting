package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.OperationComptable;
import com.yowyob.erp.accounting.entityKey.OperationComptableKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperationComptableRepository extends CassandraRepository<OperationComptable, OperationComptableKey> {
    List<OperationComptable> findByKeyTenantId(UUID tenantId);
    Optional<OperationComptable> findByKeyTenantIdAndKeyId(UUID tenantId, UUID id);
    Optional<OperationComptable> findByKeyTenantIdAndTypeOperationAndModeReglement(UUID tenantId, String typeOperation, String modeReglement);
}