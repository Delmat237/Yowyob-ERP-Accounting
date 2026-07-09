import type { EcritureAnalytique } from '@/lib/analytique/ecriture-analytique';
import type { ChargeVentilee, CentreAnalyse, CoutProduit } from '@/lib/analytique/mock-data';
import type { BudgetDto } from '@/src/lib2/models/BudgetDto';

export interface RepartitionCentreRow {
  id: string;
  libelle: string;
  nature: string;
  uniteOeuvre: string;
  montant: number;
}

export function aggregateMontantsParCentreEcritures(
  ecritures: EcritureAnalytique[],
  periodeId: string,
): Record<string, number> {
  const parCentre: Record<string, number> = {};

  for (const e of ecritures.filter(
    (x) => x.statut === 'VALIDEE' && x.exerciceAnalytiqueId === periodeId,
  )) {
    if (e.lignes?.length) {
      for (const l of e.lignes) {
        if (l.montant > 0) {
          parCentre[l.centreId] = (parCentre[l.centreId] ?? 0) + l.montant;
        }
      }
    } else if (e.montant > 0 && e.centreDestinationId) {
      parCentre[e.centreDestinationId] =
        (parCentre[e.centreDestinationId] ?? 0) + e.montant;
    }
  }

  return parCentre;
}

export function aggregateMontantsParCentreCharges(
  charges: ChargeVentilee[],
  periodeId: string,
): Record<string, number> {
  const parCentre: Record<string, number> = {};

  for (const charge of charges.filter((cv) => cv.periodeId === periodeId && cv.incorporable)) {
    for (const v of charge.ventilations) {
      parCentre[v.centreId] =
        (parCentre[v.centreId] ?? 0) + (charge.montantTotal * v.pourcentage) / 100;
    }
  }

  return parCentre;
}

export function buildRepartitionCentres(
  ecritures: EcritureAnalytique[],
  charges: ChargeVentilee[],
  centres: CentreAnalyse[],
  periodeId: string,
): RepartitionCentreRow[] {
  const fromEcritures = aggregateMontantsParCentreEcritures(ecritures, periodeId);
  const fromCharges = aggregateMontantsParCentreCharges(charges, periodeId);
  const merged: Record<string, number> = { ...fromEcritures };

  for (const [centreId, montant] of Object.entries(fromCharges)) {
    merged[centreId] = (merged[centreId] ?? 0) + montant;
  }

  return centres
    .filter((c) => c.actif)
    .map((c) => ({
      id: c.id,
      libelle: c.libelle,
      nature: c.nature,
      uniteOeuvre: c.uniteOeuvre,
      montant: Math.round(merged[c.id] ?? 0),
    }))
    .filter((c) => c.montant > 0);
}

export function computeConsommeCentreNature(
  ecritures: EcritureAnalytique[],
  centreId: string,
  natureChargeId: string,
  exerciceId: string,
): number {
  return ecritures
    .filter(
      (e) =>
        e.statut === 'VALIDEE' &&
        e.exerciceAnalytiqueId === exerciceId &&
        e.centreDestinationId === centreId &&
        e.natureChargeId === natureChargeId,
    )
    .reduce((sum, e) => sum + e.montant, 0);
}

export function findBudgetAnalytique(
  budgets: BudgetDto[],
  params: {
    centreId: string;
    natureChargeId: string;
    exerciceId: string;
  },
): BudgetDto | undefined {
  return budgets.find((b) => {
    const axes = b.axeIds ?? [];
    const matchesCentre = axes.includes(params.centreId);
    const matchesExercice =
      !b.exerciceId || b.exerciceId === params.exerciceId || b.periodeId === params.exerciceId;
    const matchesCompte =
      b.noCompte === params.natureChargeId ||
      (b.compteLines ?? []).some((l) => l.noCompte === params.natureChargeId);

    return (
      (b.type === 'ANALYTIQUE' || axes.length > 0) &&
      matchesExercice &&
      (matchesCentre || matchesCompte)
    );
  });
}

export function calcProduitsFromMock(
  couts: CoutProduit[],
  periodeId: string,
) {
  return couts
    .filter((p) => p.periodeId === periodeId)
    .map((p) => ({
      id: p.id,
      libelle: p.produitLibelle,
      CA: Math.round(p.coutRevient * 1.35),
      CV: Math.round(p.coutProduction * 0.85),
      CFspec: Math.round(p.coutProduction * 0.12),
      coutAchat: p.coutAchat,
    }));
}

export function sumEcrituresValidees(
  ecritures: EcritureAnalytique[],
  periodeId?: string,
): { count: number; montant: number } {
  const filtered = ecritures.filter((e) => {
    if (e.statut !== 'VALIDEE') return false;
    if (periodeId && e.exerciceAnalytiqueId !== periodeId) return false;
    return true;
  });

  return {
    count: filtered.length,
    montant: filtered.reduce((s, e) => s + e.montant, 0),
  };
}
