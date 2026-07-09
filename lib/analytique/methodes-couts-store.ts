import type { CoutProduit, FicheCoutStandard, RegleIncorporation, LigneConcordance, PrixCessionInterne } from '@/lib/analytique/mock-data';
import {
  mockCoutsProduits,
  mockFichesCoutStandard,
  mockLignesConcordance,
  mockPrixCessions,
  mockReglesIncorporation,
} from '@/lib/analytique/mock-data';
import type { LigneImputationRationnelle } from '@/lib/analytique/couts-calculs';

export interface MouvementStock {
  id: string;
  date: string;
  libelle: string;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  prixUnitaire: number;
}

const KEYS = {
  imputation: 'ksm.analytique.imputation-rationnelle',
  mouvements: 'ksm.analytique.mouvements-stock',
  regles: 'ksm.analytique.regles-incorporation',
  fiches: 'ksm.analytique.fiches-cout-standard',
  concordance: 'ksm.analytique.lignes-concordance',
  prixCessions: 'ksm.analytique.prix-cessions',
  coutsProduits: 'ksm.analytique.couts-produits',
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function listImputationRows(): LigneImputationRationnelle[] {
  return readJson(KEYS.imputation, []);
}

export function saveImputationRows(rows: LigneImputationRationnelle[]): void {
  writeJson(KEYS.imputation, rows);
}

export function listMouvementsStockMap(): Record<string, MouvementStock[]> {
  return readJson(KEYS.mouvements, {});
}

export function saveMouvementsStockMap(map: Record<string, MouvementStock[]>): void {
  writeJson(KEYS.mouvements, map);
}

export function listReglesIncorporation(): RegleIncorporation[] {
  const existing = readJson<RegleIncorporation[]>(KEYS.regles, []);
  if (existing.length > 0) return existing;
  writeJson(KEYS.regles, mockReglesIncorporation);
  return mockReglesIncorporation;
}

export function saveReglesIncorporation(regles: RegleIncorporation[]): void {
  writeJson(KEYS.regles, regles);
}

export function listFichesCoutStandard(): FicheCoutStandard[] {
  const existing = readJson<FicheCoutStandard[]>(KEYS.fiches, []);
  if (existing.length > 0) return existing;
  writeJson(KEYS.fiches, mockFichesCoutStandard);
  return mockFichesCoutStandard;
}

export function saveFichesCoutStandard(fiches: FicheCoutStandard[]): void {
  writeJson(KEYS.fiches, fiches);
}

export function mouvementsInitiaux(p: CoutProduit): MouvementStock[] {
  return [
    {
      id: `${p.id}-si`,
      date: '2026-03-01',
      libelle: 'Stock initial',
      type: 'ENTREE',
      quantite: 100,
      prixUnitaire: Math.round(p.coutAchat * 0.0075),
    },
    {
      id: `${p.id}-a1`,
      date: '2026-03-08',
      libelle: 'Achat matières premières',
      type: 'ENTREE',
      quantite: 200,
      prixUnitaire: Math.round(p.coutAchat * 0.008),
    },
    {
      id: `${p.id}-s1`,
      date: '2026-03-15',
      libelle: 'Consommation production',
      type: 'SORTIE',
      quantite: 150,
      prixUnitaire: 0,
    },
    {
      id: `${p.id}-a2`,
      date: '2026-03-22',
      libelle: 'Achat MP complémentaire',
      type: 'ENTREE',
      quantite: 100,
      prixUnitaire: Math.round(p.coutAchat * 0.0085),
    },
  ];
}

export function getMouvementsForProduit(
  produit: CoutProduit,
  map?: Record<string, MouvementStock[]>,
): MouvementStock[] {
  const stored = map ?? listMouvementsStockMap();
  return stored[produit.id] ?? mouvementsInitiaux(produit);
}

export function listLignesConcordance(): LigneConcordance[] {
  const existing = readJson<LigneConcordance[]>(KEYS.concordance, []);
  if (existing.length > 0) return existing;
  writeJson(KEYS.concordance, mockLignesConcordance);
  return mockLignesConcordance;
}

export function saveLignesConcordance(lignes: LigneConcordance[]): void {
  writeJson(KEYS.concordance, lignes);
}

export function listPrixCessions(): PrixCessionInterne[] {
  const existing = readJson<PrixCessionInterne[]>(KEYS.prixCessions, []);
  if (existing.length > 0) return existing;
  writeJson(KEYS.prixCessions, mockPrixCessions);
  return mockPrixCessions;
}

export function savePrixCessions(cessions: PrixCessionInterne[]): void {
  writeJson(KEYS.prixCessions, cessions);
}

export function listCoutsProduits(): CoutProduit[] {
  const existing = readJson<CoutProduit[]>(KEYS.coutsProduits, []);
  if (existing.length > 0) return existing;
  writeJson(KEYS.coutsProduits, mockCoutsProduits);
  return mockCoutsProduits;
}

export function saveCoutsProduits(produits: CoutProduit[]): void {
  writeJson(KEYS.coutsProduits, produits);
}
