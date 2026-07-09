package com.yowyob.erp.accounting.infrastructure.persistence.repository;

import com.yowyob.erp.accounting.domain.model.EcritureAnalytique;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import java.util.UUID;

@Repository
public interface EcritureAnalytiqueRepository extends R2dbcRepository<EcritureAnalytique, UUID> {
    Flux<EcritureAnalytique> findByOrganizationId(UUID organizationId);

    @Query("SELECT * FROM ecritures_analytiques WHERE organization_id = :orgId AND statut = :statut ORDER BY created_at DESC")
    Flux<EcritureAnalytique> findByOrganizationIdAndStatut(@Param("orgId") UUID orgId, @Param("statut") String statut);

    @Query("SELECT * FROM ecritures_analytiques WHERE organization_id = :orgId AND periode_id = :periodeId ORDER BY date_effet DESC")
    Flux<EcritureAnalytique> findByOrganizationIdAndPeriodeId(@Param("orgId") UUID orgId, @Param("periodeId") UUID periodeId);

    @Query("SELECT * FROM ecritures_analytiques WHERE organization_id = :orgId AND statut = :statut AND periode_id = :periodeId ORDER BY date_effet DESC")
    Flux<EcritureAnalytique> findByOrganizationIdAndStatutAndPeriodeId(@Param("orgId") UUID orgId, @Param("statut") String statut, @Param("periodeId") UUID periodeId);
}
