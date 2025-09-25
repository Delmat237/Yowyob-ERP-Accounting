package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.Contrepartie;
import com.yowyob.erp.accounting.entityKey.ContrepartieKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


@Repository
public interface ContrepartieRepository extends CassandraRepository<Contrepartie, ContrepartieKey> {

    List<Contrepartie> findByKeyTenantIdAndKeyOperationComptableId(UUID tenantId, UUID operationComptableId);

    List<Contrepartie> findByKeyTenantIdAndCompte(UUID tenantId, String compte);

    @Query("DELETE FROM contrepartie WHERE tenant_id = :tenantId AND operation_comptable_id = :operationComptableId")
    void deleteByKeyTenantIdAndKeyOperationComptableId(UUID tenantId, UUID operationComptableId);
}
