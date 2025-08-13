package com.yowyob.erp.accounting.entity;

import java.io.Serializable;
import java.util.UUID;

import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

@PrimaryKeyClass
public class PlanComptableKey implements Serializable {

    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID tenantId;

    @PrimaryKeyColumn(name = "id", ordinal = 1, type = PrimaryKeyType.CLUSTERED)
    private UUID id;

    // Getters
    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getId() {
        return id;
    }

    // Setters
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PlanComptableKey that = (PlanComptableKey) o;
        return tenantId.equals(that.tenantId) && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        int result = tenantId.hashCode();
        result = 31 * result + id.hashCode();
        return result;
    }
}