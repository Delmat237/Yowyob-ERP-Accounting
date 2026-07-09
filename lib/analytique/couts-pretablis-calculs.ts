import type { CoutProduit, FicheCoutStandard } from '@/lib/analytique/mock-data';

export interface ComposanteCoutPreetabli {
  matieres: number;
  mod: number;
  fap: number;
}

export interface EcartCoutPreetabli {
  id: string;
  produitCode: string;
  produitLibelle: string;
  qtePreetablie: number;
  qteReelle: number;
  coutPreetabli: ComposanteCoutPreetabli;
  coutReel: ComposanteCoutPreetabli;
}

const MOCK_ECARTS: Record<string, EcartCoutPreetabli> = {
  P1: {
    id: 'P1',
    produitCode: 'PROD-A',
    produitLibelle: 'Produit Alpha',
    qtePreetablie: 1000,
    qteReelle: 1100,
    coutPreetabli: { matieres: 4500, mod: 2000, fap: 1500 },
    coutReel: { matieres: 4800, mod: 1900, fap: 1600 },
  },
  P2: {
    id: 'P2',
    produitCode: 'PROD-B',
    produitLibelle: 'Produit Beta',
    qtePreetablie: 800,
    qteReelle: 750,
    coutPreetabli: { matieres: 6000, mod: 3000, fap: 2000 },
    coutReel: { matieres: 5800, mod: 3200, fap: 2100 },
  },
};

function unitCostFromFiche(fiche: FicheCoutStandard): ComposanteCoutPreetabli {
  const matieres = fiche.lignes.find((l) => l.composante === 'MATIERES');
  const mod = fiche.lignes.find((l) => l.composante === 'MOD');
  const fap = fiche.lignes.find((l) => l.composante === 'CHARGES_INDIRECTES');
  return {
    matieres: matieres?.coutUnitaireStandard ?? 0,
    mod: mod?.coutUnitaireStandard ?? 0,
    fap: fap?.coutUnitaireStandard ?? 0,
  };
}

function splitRealCosts(
  totalReel: number,
  stdUnit: ComposanteCoutPreetabli,
): ComposanteCoutPreetabli {
  const stdTotal = stdUnit.matieres + stdUnit.mod + stdUnit.fap;
  if (stdTotal <= 0 || totalReel <= 0) {
    return { matieres: 0, mod: 0, fap: 0 };
  }
  const ratio = totalReel / stdTotal;
  return {
    matieres: stdUnit.matieres * ratio,
    mod: stdUnit.mod * ratio,
    fap: stdUnit.fap * ratio,
  };
}

export function buildEcartsFromApiData(
  fiches: FicheCoutStandard[],
  produits: CoutProduit[],
): EcartCoutPreetabli[] {
  if (fiches.length === 0) {
    return Object.values(MOCK_ECARTS);
  }

  return fiches.map((fiche, index) => {
    const produit = produits.find((p) => p.produitCode === fiche.produitCode);
    const coutPreetabli = unitCostFromFiche(fiche);
    const stdUnitTotal = coutPreetabli.matieres + coutPreetabli.mod + coutPreetabli.fap;
    const qtePreetablie = Math.max(
      1000,
      Math.round(
        fiche.lignes.reduce((max, l) => Math.max(max, l.quantiteStandard), 0) * 200,
      ),
    );
    const realTotalUnit = produit?.coutProduction ?? stdUnitTotal;
    const varianceRatio = stdUnitTotal > 0 ? realTotalUnit / stdUnitTotal : 1;
    const qteReelle = Math.round(qtePreetablie * (varianceRatio > 1 ? 1.1 : 0.95));
    const coutReel = splitRealCosts(realTotalUnit, coutPreetabli);

    return {
      id: fiche.id || `ecart-${index}`,
      produitCode: fiche.produitCode,
      produitLibelle: fiche.produitLibelle,
      qtePreetablie,
      qteReelle,
      coutPreetabli,
      coutReel,
    };
  });
}

export function getMockEcarts(): EcartCoutPreetabli[] {
  return Object.values(MOCK_ECARTS);
}
