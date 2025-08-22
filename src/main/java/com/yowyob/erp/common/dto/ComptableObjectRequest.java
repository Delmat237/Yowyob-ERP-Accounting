package com.yowyob.erp.common.dto;

  import jakarta.validation.constraints.NotNull;
  import com.yowyob.erp.common.enums.SourceType;

  import java.time.LocalDate;
  import java.util.UUID;

  import lombok.Data;

    @Data
  public class ComptableObjectRequest {

      @NotNull
      private SourceType type;

      private UUID id;
      private UUID tenantId;
      private Double montant;
      private Double montantHT;
      private Integer quantite;
      private Double coutUnitaire;
      private LocalDate date;
      private String libelle;
      private UUID journalComptableId;
      private UUID clientId;
      private Boolean isAchat;
      private Boolean isEntree;
      private UUID fournisseurId;
      private UUID contrepartieId;

  }