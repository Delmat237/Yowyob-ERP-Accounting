export type PrixCessionVersionDto = {
  id?: string;
  prixUnitaire?: number;
  methode?: string;
  du?: string;
  au?: string;
};

export type PrixCessionInterneDto = {
  id?: string;
  centreCedantId?: string;
  centreCedantLibelle?: string;
  centreBeneficiaireId?: string;
  centreBeneficiaireLibelle?: string;
  prestationLibelle?: string;
  methode?: string;
  prixUnitaire?: number;
  uniteId?: string;
  uniteLibelle?: string;
  dateDebut?: string;
  dateFin?: string;
  hasImputations?: boolean;
  versions?: PrixCessionVersionDto[];
};
