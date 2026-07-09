import type { ConcordanceResult } from '@/lib/analytique/concordance-calculs';
import type { LigneConcordance } from '@/lib/analytique/mock-data';
import type { ConcordanceCalculDto } from '@/src/lib2/models/ConcordanceCalculDto';

/** Fusionne le calcul serveur avec les totaux CG/produits côté client. */
export function mergeConcordanceApiWithLocal(
  local: ConcordanceResult,
  api: ConcordanceCalculDto | null,
  lignes: LigneConcordance[],
): ConcordanceResult {
  if (!api) {
    return local;
  }

  const resultCG = local.resultCG;
  const sommeDiff = api.sommeDiff ?? local.sommeDiff;
  const totalAnalytiqueEcritures =
    api.totalAnalytiqueEcritures ?? local.totalAnalytiqueEcritures;
  const referenceAnalytique =
    totalAnalytiqueEcritures > 0
      ? totalAnalytiqueEcritures
      : local.resultatAnalytiqueProduits;
  const resultCA = resultCG + sommeDiff;
  const ecartVerif = resultCA - referenceAnalytique;

  return {
    periodeCG: local.periodeCG,
    resultCG,
    totalChargesCG: local.totalChargesCG,
    totalProduitsCG: local.totalProduitsCG,
    totalNonInc: api.totalNonInc ?? local.totalNonInc,
    totalIncorporable: api.totalIncorporable ?? local.totalIncorporable,
    totalAnalytiqueEcritures,
    sommeDiff,
    resultCA,
    resultatAnalytiqueProduits: local.resultatAnalytiqueProduits,
    ecartVerif,
    concordanceOk: Math.abs(ecartVerif) < 1000,
  };
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isConcordancePeriodeApiReady(periodeId: string): boolean {
  return UUID_PATTERN.test(periodeId);
}
