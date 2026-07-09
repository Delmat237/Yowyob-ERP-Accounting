import type { EcritureAnalytique } from '@/lib/analytique/ecriture-analytique';
import type { CentreAnalyse, CoutProduit } from '@/lib/analytique/mock-data';
import { aggregateMontantsParCentreEcritures } from '@/lib/analytique/analytique-aggregations';

export interface ProduitDirectCosting {
  id: string;
  produit: string;
  produitCode: string;
  CA: number;
  CV: number;
  CV_spec: number;
}

export interface LigneImputationRationnelle {
  centreId: string;
  centre: string;
  unite: string;
  actNormale: number;
  actReelle: number;
  chFixes: number;
}

export function enrichCoutsProduits(
  produits: CoutProduit[],
  ecritures: EcritureAnalytique[],
  periodeId: string,
): CoutProduit[] {
  const chargesPeriode = ecritures
    .filter((e) => e.statut === 'VALIDEE' && e.exerciceAnalytiqueId === periodeId)
    .reduce((s, e) => s + e.montant, 0);

  if (chargesPeriode <= 0) return produits;

  const extraPerProduct = chargesPeriode / Math.max(produits.length, 1);

  return produits.map((p) => {
    if (p.periodeId !== periodeId && produits.some((x) => x.periodeId === periodeId)) {
      return p;
    }
    const extra = Math.round(extraPerProduct * 0.25);
    return {
      ...p,
      coutProduction: p.coutProduction + extra,
      coutRevient: p.coutRevient + extra,
    };
  });
}

export function buildProduitDirectCostingData(produits: CoutProduit[]): ProduitDirectCosting[] {
  return produits.map((p) => ({
    id: p.id,
    produit: p.produitLibelle,
    produitCode: p.produitCode,
    CA: Math.round(p.coutRevient * 1.35),
    CV: Math.round(p.coutProduction * 0.85),
    CV_spec: Math.round(p.coutProduction * 0.12),
  }));
}

export function buildImputationRationnelleRows(
  centres: CentreAnalyse[],
  ecritures: EcritureAnalytique[],
  periodeId: string,
  saved?: LigneImputationRationnelle[],
): LigneImputationRationnelle[] {
  const montantsCentre = aggregateMontantsParCentreEcritures(ecritures, periodeId);

  return centres
    .filter((c) => c.actif)
    .map((centre) => {
      const savedRow = saved?.find((r) => r.centreId === centre.id);
      const chFixes = Math.round(montantsCentre[centre.id] ?? savedRow?.chFixes ?? 0);
      const actNormale = savedRow?.actNormale ?? 1000;
      const actReelle =
        savedRow?.actReelle ??
        Math.max(1, Math.round(actNormale * (chFixes > 0 ? 0.85 : 1)));

      return {
        centreId: centre.id,
        centre: centre.libelle,
        unite: centre.uniteOeuvre || 'UO',
        actNormale,
        actReelle,
        chFixes: chFixes > 0 ? chFixes : savedRow?.chFixes ?? 400000,
      };
    });
}

export function computeImputationRow(row: LigneImputationRationnelle) {
  const coeff = row.actNormale > 0 ? row.actReelle / row.actNormale : 1;
  const cfImputees = row.chFixes * coeff;
  const diff = row.chFixes - cfImputees;
  return { ...row, coeff, cfImputees, diff };
}
