import type { LigneConcordanceDto } from './LigneConcordanceDto';

export type ConcordanceCalculDto = {
  periodeId?: string;
  periodeCgLibelle?: string;
  resultCG?: number;
  totalChargesCG?: number;
  totalProduitsCG?: number;
  totalNonInc?: number;
  totalIncorporable?: number;
  totalAnalytiqueEcritures?: number;
  sommeDiff?: number;
  resultCA?: number;
  ecartVerif?: number;
  concordanceOk?: boolean;
  lignesManuelles?: LigneConcordanceDto[];
  lignesAuto?: LigneConcordanceDto[];
  lignes?: LigneConcordanceDto[];
};

export type ConcordancePeriodeDto = {
  periodeId?: string;
  lignesManuelles?: LigneConcordanceDto[];
  calcul?: ConcordanceCalculDto;
};
