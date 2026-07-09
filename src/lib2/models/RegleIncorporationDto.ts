export type RegleIncorporationDto = {
  id?: string;
  compteCgId: string;
  compteCgNo: string;
  libelle: string;
  mode: string;
  tauxSubstitution?: number;
  montantSubstitution?: number;
  baseCalcul?: string;
  justification?: string;
  compteEcart97?: string;
  periodeId?: string;
  dateDebut?: string;
  dateFin?: string;
  hasEcritures?: boolean;
};
