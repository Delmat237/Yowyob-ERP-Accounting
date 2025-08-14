package com.yowyob.erp.accounting.repository;

import com.yowyob.erp.accounting.entity.Transaction;
import com.yowyob.erp.accounting.entityKey.TransactionKey;

import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends  CassandraRepository<Transaction, TransactionKey> {

    List<Transaction> findByTenantIdOrderByDateTransactionDesc(UUID tenantId);

    Optional<Transaction> findByTenantIdAndNumeroRecu(UUID tenantId, String numeroRecu);

    List<Transaction> findByTenantIdAndEstComptabiliseeFalse(UUID tenantId);

    List<Transaction> findByTenantIdAndEstValideeFalse(UUID tenantId);

    @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.dateTransaction BETWEEN :startDate AND :endDate")
    List<Transaction> findByTenantIdAndDateRange(@Param("tenantId") UUID tenantId,
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(t.montantTransaction) FROM Transaction t WHERE t.tenantId = :tenantId AND t.estValidee = true")
    Double getTotalValidatedTransactions(@Param("tenantId") UUID tenantId);

    @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.caissier = :caissier")
    List<Transaction> findByTenantIdAndCaissier(@Param("tenantId") UUID tenantId,
                                              @Param("caissier") String caissier);

    boolean existsByTenantIdAndNumeroRecu(UUID tenantId, String numeroRecu);

    Optional<Transaction> findByKeyTenantIdAndKeyId(UUID tenantId, UUID transactionId);
}
