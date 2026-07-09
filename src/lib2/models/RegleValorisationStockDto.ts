export type HistoriqueValorisationDto = {
  methode?: string;
  du?: string;
  au?: string;
};

export type RegleValorisationStockDto = {
  id?: string;
  familleId: string;
  familleLibelle: string;
  methode: string;
  dateApplication: string;
  actif?: boolean;
  historique?: HistoriqueValorisationDto[];
};
