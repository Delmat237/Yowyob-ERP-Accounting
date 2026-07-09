export type ActiviteNormaleDto = {
  centreId?: string;
  centreLibelle?: string;
  activiteNormale?: number;
  unite?: string;
};

export type MethodeCalculCoutDto = {
  id?: string;
  methode: string;
  planAnalytiqueId: string;
  dateApplication: string;
  statut: string;
  description?: string;
  activitesNormales?: ActiviteNormaleDto[];
};
