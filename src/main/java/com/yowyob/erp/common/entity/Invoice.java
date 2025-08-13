package com.yowyob.erp.common.entity;

import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Table("invoices")
public class Invoice {
    @PrimaryKey
    private InvoiceKey key;

    private String invoiceNumber;
    private UUID customerId;
    private Double totalAmount;
    private LocalDateTime issueDate = LocalDateTime.now();
    private String status = "DRAFT";

    @Data
    public static class InvoiceKey {
        private UUID tenantId;
        private UUID invoiceId;
    }
}