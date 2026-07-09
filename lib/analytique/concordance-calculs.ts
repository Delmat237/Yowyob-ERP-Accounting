import type { EcritureAnalytique } from '@/lib/analytique/ecriture-analytique';
import type {
  ChargeVentilee,
  CoutProduit,
  LigneConcordance,
  PeriodeAnalytique,
  PeriodeCG,
} from '@/lib/analytique/mock-data';
import { resolvePeriodeCG } from '@/lib/analytique/periodes-alignees';
import { calcProduitsFromMock } from '@/lib/analytique/analytique-aggregations';

export interface ConcordanceResult {
  periodeCG: PeriodeCG | null;
  resultCG: number;
  totalChargesCG: number;
  totalProduitsCG: number;
  totalNonInc: number;
  totalIncorporable: number;
  totalAnalytiqueEcritures: number;
  sommeDiff: number;
  resultCA: number;
  resultatAnalytiqueProduits: number;
  ecartVerif: number;
  concordanceOk: boolean;
}

export function buildLignesAutoFromCharges(
  charges: ChargeVentilee[],
  periodeId: string,
): LigneConcordance[] {
  const nonInc = charges.filter((c) => c.periodeId === periodeId && !c.incorporable);
  if (nonInc.length === 0) return [];

  const total = nonInc.reduce((s, c) => s + c.montantTotal, 0);
  return [
    {
      id: `auto-non-inc-${periodeId}`,
      type: 'CHARGE_NON_INC',
      label: 'Charges non incorporables (auto)',
      description: nonInc.map((c) => `${c.compteCG} — ${c.libelle}`).join(' · '),
      signe: '+',
      montant: total,
      chargeVentileeId: nonInc[0]?.id,
    },
  ];
}

export function mergeLignesConcordance(
  manuelles: LigneConcordance[],
  auto: LigneConcordance[],
): LigneConcordance[] {
  const autoChargeIds = new Set(
    auto.map((l) => l.chargeVentileeId).filter(Boolean) as string[],
  );
  const filtered = manuelles.filter(
    (l) => !l.chargeVentileeId || !autoChargeIds.has(l.chargeVentileeId),
  );
  const manualNonIncTotal = filtered
    .filter((l) => l.type === 'CHARGE_NON_INC')
    .reduce((s, l) => s + l.montant, 0);
  const autoNonInc = auto.filter((l) => l.type === 'CHARGE_NON_INC');
  const mergedAuto = manualNonIncTotal > 0 ? auto.filter((l) => l.type !== 'CHARGE_NON_INC') : auto;
  return [...filtered, ...mergedAuto];
}

export function sommeLignesConcordance(lignes: LigneConcordance[]): number {
  return lignes.reduce((s, l) => (l.signe === '+' ? s + l.montant : s - l.montant), 0);
}

export function computeConcordance(params: {
  periode: PeriodeAnalytique | undefined;
  periodesCG: PeriodeCG[];
  charges: ChargeVentilee[];
  ecritures: EcritureAnalytique[];
  produits: CoutProduit[];
  lignes: LigneConcordance[];
  periodeId: string;
}): ConcordanceResult {
  const periodeCG = params.periode
    ? resolvePeriodeCG(params.periode, params.periodesCG)
    : null;

  const resultCG = periodeCG?.resultatNet ?? 0;
  const totalChargesCG = periodeCG?.totalChargesCG ?? 0;
  const totalProduitsCG = periodeCG?.totalProduitsCG ?? 0;

  const chargesPeriode = params.charges.filter((c) => c.periodeId === params.periodeId);
  const totalNonInc = chargesPeriode
    .filter((c) => !c.incorporable)
    .reduce((s, c) => s + c.montantTotal, 0);
  const totalIncorporable = chargesPeriode
    .filter((c) => c.incorporable)
    .reduce((s, c) => s + c.montantTotal, 0);

  const totalAnalytiqueEcritures = params.ecritures
    .filter((e) => e.statut === 'VALIDEE' && e.exerciceAnalytiqueId === params.periodeId)
    .reduce((s, e) => s + e.montant, 0);

  const produitsPeriode = params.produits.filter((p) => p.periodeId === params.periodeId);
  const produitsCalc = calcProduitsFromMock(produitsPeriode, params.periodeId);
  const resultatAnalytiqueProduits = produitsCalc.reduce(
    (s, p) => s + (p.CA - p.CV - p.CFspec),
    0,
  );

  const sommeDiff = sommeLignesConcordance(params.lignes);
  const resultCA = resultCG + sommeDiff;

  const referenceAnalytique =
    totalAnalytiqueEcritures > 0 ? totalAnalytiqueEcritures : resultatAnalytiqueProduits;
  const ecartVerif = resultCA - referenceAnalytique;
  const concordanceOk = Math.abs(ecartVerif) < 1000;

  return {
    periodeCG,
    resultCG,
    totalChargesCG,
    totalProduitsCG,
    totalNonInc,
    totalIncorporable,
    totalAnalytiqueEcritures,
    sommeDiff,
    resultCA,
    resultatAnalytiqueProduits,
    ecartVerif,
    concordanceOk,
  };
}
