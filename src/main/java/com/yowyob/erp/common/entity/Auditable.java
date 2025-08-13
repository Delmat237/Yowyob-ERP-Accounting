package com.yowyob.erp.common.entity;

import java.util.UUID;
import java.time.LocalDateTime;

public interface Auditable {
    UUID getTenantId();
    void setTenantId(UUID tenantId);
    LocalDateTime getCreatedAt();
    void setCreatedAt(LocalDateTime createdAt);
    LocalDateTime getUpdatedAt();
    void setUpdatedAt(LocalDateTime updatedAt);
    String getCreatedBy();
    void setCreatedBy(String createdBy);
    String getUpdatedBy();
    void setUpdatedBy(String updatedBy);
}
