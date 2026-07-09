export type ChargeAnalytiqueDto = {
  id?: string;
  nature: string;
  montant: number;
  type: string;
  incorporable?: boolean;
  centreId?: string;
  centreLibelle?: string;
  periodeId?: string;
  description?: string;
};
