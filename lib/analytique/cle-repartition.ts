export type TypeCleRepartition = 'FIXE' | 'COUT_UNITAIRE' | 'UNITE_OEUVRE';

export interface LigneCleRepartition {
  centreId: string;
  pourcentage: number;
  uniteOeuvreId?: string;
}

export interface CleRepartitionUi {
  id: string;
  code: string;
  libelle: string;
  type: TypeCleRepartition;
  actif: boolean;
  lignes: LigneCleRepartition[];
}

export const TYPE_CLE_LABELS: Record<TypeCleRepartition, string> = {
  FIXE: 'Répartition fixe (%)',
  COUT_UNITAIRE: 'Coût unitaire',
  UNITE_OEUVRE: "Unité d'œuvre",
};

export const mockClesRepartition: CleRepartitionUi[] = [
  {
    id: 'cle-demo-1',
    code: 'CLE-ELEC',
    libelle: 'Électricité',
    type: 'FIXE',
    actif: true,
    lignes: [
      { centreId: 'c1', pourcentage: 60 },
      { centreId: 'c2', pourcentage: 20 },
      { centreId: 'c3', pourcentage: 10 },
      { centreId: 'c4', pourcentage: 5 },
      { centreId: 'c5', pourcentage: 5 },
    ],
  },
  {
    id: 'cle-demo-2',
    code: 'CLE-AMORT',
    libelle: 'Amortissements',
    type: 'FIXE',
    actif: true,
    lignes: [
      { centreId: 'c1', pourcentage: 70 },
      { centreId: 'c2', pourcentage: 10 },
      { centreId: 'c3', pourcentage: 15 },
      { centreId: 'c4', pourcentage: 5 },
    ],
  },
];
