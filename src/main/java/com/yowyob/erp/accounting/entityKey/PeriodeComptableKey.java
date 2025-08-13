package com.yowyob.erp.accounting.entityKey;

import org.springframework.data.cassandra.core.cql.Ordering;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.io.Serializable;
import java.util.UUID;

@PrimaryKeyClass
public class PeriodeComptableKey implements Serializable {

    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID tenantId;

    @PrimaryKeyColumn(name = "id", ordinal = 1, type = PrimaryKeyType.CLUSTERED, ordering = Ordering.ASCENDING)
    private UUID id;

    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getId() {
        return id;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public PeriodeComptableKey() {}

    public PeriodeComptableKey(UUID tenantId, UUID id) {
        this.tenantId = tenantId;
        this.id = id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PeriodeComptableKey that = (PeriodeComptableKey) o;
        return tenantId.equals(that.tenantId) && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        int result = tenantId.hashCode();
        result = 31 * result + id.hashCode();
        return result;
    }
}