package com.yowyob.erp.common.entity;

import java.time.LocalDateTime;

public interface Auditable {
    String getTenantId();
    void setTenantId(String tenantId);
    LocalDateTime getCreatedAt();
    void setCreatedAt(LocalDateTime createdAt);
    LocalDateTime getUpdatedAt();
    void setUpdatedAt(LocalDateTime updatedAt);
    String getCreatedBy();
    void setCreatedBy(String createdBy);
    String getUpdatedBy();
    void setUpdatedBy(String updatedBy);
}
