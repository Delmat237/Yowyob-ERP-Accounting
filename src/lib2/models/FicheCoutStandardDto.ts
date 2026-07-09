export type LigneCoutStandardDto = {
  id?: string;
  composante?: string;
  centreId?: string;
  centreLibelle?: string;
  libelle?: string;
  quantiteStandard?: number;
  coutUnitaireStandard?: number;
  coutStandardTotal?: number;
  activiteNormale?: number;
};

export type FicheCoutStandardDto = {
  id?: string;
  produitCode?: string;
  produitLibelle?: string;
  periodeRefId?: string;
  planAnalytiqueId?: string;
  periodeCommencee?: boolean;
  lignes?: LigneCoutStandardDto[];
};
