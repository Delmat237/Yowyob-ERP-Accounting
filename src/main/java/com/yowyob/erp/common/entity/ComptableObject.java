package com.yowyob.erp.common.entity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.yowyob.erp.common.enums.SourceType;

import com.yowyob.erp.accounting.entity.DetailEcriture;

public interface ComptableObject {
    UUID getId();
    double getMontant();
    LocalDate getDate();
    String getLibelle();
    UUID getJournalComptableId();
    List<DetailEcriture> generateEcritureDetails(UUID tenantId, UUID ecritureId);
    SourceType getSourceType();
}