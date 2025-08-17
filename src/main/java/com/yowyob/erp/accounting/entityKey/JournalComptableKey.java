package com.yowyob.erp.accounting.entityKey;

import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.io.Serializable;
import java.util.UUID;

import lombok.Data;

@Data
@PrimaryKeyClass
public class JournalComptableKey implements Serializable {

    public JournalComptableKey() {
    }   
    public JournalComptableKey(UUID tenantId, UUID id) {
        this.tenantId = tenantId;
        this.id = id;
    }
    
    @PrimaryKeyColumn(name = "tenant_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID tenantId;

    @PrimaryKeyColumn(name = "id", type = PrimaryKeyType.CLUSTERED, ordinal = 0)
    private UUID id;

    @PrimaryKeyColumn(name = "code_journal", type = PrimaryKeyType.CLUSTERED, ordinal = 1)
    private String codeJournal;


    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JournalComptableKey that = (JournalComptableKey) o;
        return tenantId.equals(that.tenantId) && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        int result = tenantId.hashCode();
        result = 31 * result + id.hashCode();
        return result;
    }
}