package com.yowyob.erp.accounting.entity;

import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.io.Serializable;
import java.util.UUID;

@PrimaryKeyClass
public class TenantKey implements Serializable {

    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID tenantId;

    // Getters
    public UUID getTenantId() {
        return tenantId;
    }

    // Setters
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TenantKey that = (TenantKey) o;
        return tenantId.equals(that.tenantId);
    }

    @Override
    public int hashCode() {
        return tenantId.hashCode();
    }
}