export type LigneConcordanceDto = {
  id?: string;
  type: string;
  label: string;
  description?: string;
  signe: string;
  montant: number;
  chargeVentileeId?: string;
  autoGeneree?: boolean;
};
