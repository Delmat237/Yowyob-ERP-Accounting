package com.yowyob.erp.accounting.entityKey;

import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.io.Serializable;
import java.util.UUID;

import lombok.Data;

@Data
@PrimaryKeyClass
public class DetailEcritureKey implements Serializable {

    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID tenantId;

    @PrimaryKeyColumn(name = "ecriture_id", ordinal = 1, type = PrimaryKeyType.CLUSTERED)
    private UUID ecritureComptableId;

    @PrimaryKeyColumn(name = "id", ordinal = 2, type = PrimaryKeyType.CLUSTERED)
    private UUID id;


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