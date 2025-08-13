package com.yowyob.erp.common.entity;

import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;
import com.yowyob.erp.common.enums.OHADAAccountClass;
import java.util.UUID;

@Data
@Table("accounts")
public class Account {
    @PrimaryKey
    private AccountKey key;

    private String name;
    private OHADAAccountClass ohadaClass;
    private String accountType;
    private Double balance = 0.0;

    @Data
    public static class AccountKey {
        private UUID tenantId;
        private String accountNumber;
    }
}