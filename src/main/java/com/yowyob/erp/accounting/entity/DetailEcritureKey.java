package com.yowyob.erp.accounting.entity;

import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.io.Serializable;
import java.util.UUID;

@PrimaryKeyClass
public class DetailEcritureKey implements Serializable {

    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID tenantId;

    @PrimaryKeyColumn(name = "ecriture_comptable_id", ordinal = 1, type = PrimaryKeyType.CLUSTERED)
    private UUID ecritureComptableId;

    @PrimaryKeyColumn(name = "id", ordinal = 2, type = PrimaryKeyType.CLUSTERED)
    private UUID id;

    // Getters
    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getEcritureComptableId() {
        return ecritureComptableId;
    }

    public UUID getId() {
        return id;
    }

    // Setters
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public void setEcritureComptableId(UUID ecritureComptableId) {
        this.ecritureComptableId = ecritureComptableId;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DetailEcritureKey that = (DetailEcritureKey) o;
        return tenantId.equals(that.tenantId) &&
               ecritureComptableId.equals(that.ecritureComptableId) &&
               id.equals(that.id);
    }

    @Override
    public int hashCode() {
        int result = tenantId.hashCode();
        result = 31 * result + ecritureComptableId.hashCode();
        result = 31 * result + id.hashCode();
        return result;
    }
}