import type { LigneImputationDto } from './LigneImputationDto';

export type EcritureAnalytiqueDto = {
  id?: string;
  journalId: string;
  journalLibelle?: string;
  periodeId?: string;
  periodeLibelle?: string;
  numeroPiece?: string;
  libelle: string;
  dateEffet: string;
  origine?: string;
  statut?: string;
  ecriturecgRef?: string;
  montantTotal: number;
  natureChargeId?: string;
  natureChargeLibelle?: string;
  validatedAt?: string;
  validatedBy?: string;
  rejectReason?: string;
  lignes?: LigneImputationDto[];
};
