/**
 * Classes décimales OHADA de la comptabilité analytique (classe 9).
 * Référence : SYSCOHADA — plan de comptes analytiques.
 */
export const CLASSES_ANALYTIQUES = [
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
] as const;

export type ClasseAnalytique = (typeof CLASSES_ANALYTIQUES)[number];

export const CLASSE_ANALYTIQUE_LABELS: Record<ClasseAnalytique, string> = {
  "90": "Classe 90 — Comptes de réfléchissement",
  "91": "Classe 91 — Répartition des charges indirectes",
  "92": "Classe 92 — Sections analytiques (Centres)",
  "93": "Classe 93 — Traitement des charges (Coûts)",
  "94": "Classe 94 — Inventaire permanent (Stocks)",
  "95": "Classe 95 — Écarts sur coûts préétablis",
  "96": "Classe 96 — Écarts de répartition indirecte",
  "97": "Classe 97 — Résultats analytiques",
  "98": "Classe 98 — Intégration du résultat",
  "99": "Classe 99 — Contrepartie de réfléchissement",
};

export const CLASSE_ANALYTIQUE_DESCRIPTIONS: Record<ClasseAnalytique, string> = {
  "90": "Miroir des charges et produits de la comptabilité générale.",
  "91": "Ventilation des charges indirectes entre sections.",
  "92": "Centres d'analyse et sections homogènes.",
  "93": "Comptes de coûts et traitement des charges.",
  "94": "Suivi des stocks en valeur analytique.",
  "95": "Écarts constatés sur coûts préétablis.",
  "96": "Écarts de répartition des charges indirectes.",
  "97": "Marges et résultats par centre ou produit.",
  "98": "Intégration des éléments du résultat analytique.",
  "99": "Contrepartie des comptes de réfléchissement (classe 90).",
};

export const CLASSE_ANALYTIQUE_NUMERO_EXAMPLES: Record<ClasseAnalytique, string> = {
  "90": "906061",
  "91": "911000",
  "92": "921000",
  "93": "931000",
  "94": "941000",
  "95": "951000",
  "96": "961000",
  "97": "971000",
  "98": "981000",
  "99": "991000",
};

/** Déduit la classe à partir des deux premiers chiffres du numéro. */
export function detectClasseFromNumero(numero: string): ClasseAnalytique | null {
  if (numero.length < 2) return null;
  const prefix = numero.slice(0, 2);
  return CLASSES_ANALYTIQUES.includes(prefix as ClasseAnalytique)
    ? (prefix as ClasseAnalytique)
    : null;
}

export function emptyComptesParClasse<T = never>(): Record<ClasseAnalytique, T[]> {
  return CLASSES_ANALYTIQUES.reduce(
    (acc, cl) => {
      acc[cl] = [];
      return acc;
    },
    {} as Record<ClasseAnalytique, T[]>,
  );
}

/** Styles d'affichage (listes, filtres). */
export const CLASSE_ANALYTIQUE_UI: Record<
  ClasseAnalytique,
  { label: string; full: string; color: string; bg: string; badge: string; border: string }
> = {
  "90": { label: "Classe 90", full: "Comptes de réfléchissement", color: "text-indigo-700", bg: "bg-indigo-50/60 border-indigo-200", badge: "bg-indigo-100 text-indigo-700 border-indigo-200", border: "border-indigo-200" },
  "91": { label: "Classe 91", full: "Répartition charges indirectes", color: "text-violet-700", bg: "bg-violet-50/60 border-violet-200", badge: "bg-violet-100 text-violet-700 border-violet-200", border: "border-violet-200" },
  "92": { label: "Classe 92", full: "Sections / Centres d'analyse", color: "text-emerald-700", bg: "bg-emerald-50/60 border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "border-emerald-200" },
  "93": { label: "Classe 93", full: "Traitement des charges (Coûts)", color: "text-cyan-700", bg: "bg-cyan-50/60 border-cyan-200", badge: "bg-cyan-100 text-cyan-700 border-cyan-200", border: "border-cyan-200" },
  "94": { label: "Classe 94", full: "Inventaire permanent", color: "text-amber-700", bg: "bg-amber-50/60 border-amber-200", badge: "bg-amber-100 text-amber-700 border-amber-200", border: "border-amber-200" },
  "95": { label: "Classe 95", full: "Écarts coûts préétablis", color: "text-orange-700", bg: "bg-orange-50/60 border-orange-200", badge: "bg-orange-100 text-orange-700 border-orange-200", border: "border-orange-200" },
  "96": { label: "Classe 96", full: "Écarts répartition indirecte", color: "text-lime-700", bg: "bg-lime-50/60 border-lime-200", badge: "bg-lime-100 text-lime-700 border-lime-200", border: "border-lime-200" },
  "97": { label: "Classe 97", full: "Résultats analytiques", color: "text-rose-700", bg: "bg-rose-50/60 border-rose-200", badge: "bg-rose-100 text-rose-700 border-rose-200", border: "border-rose-200" },
  "98": { label: "Classe 98", full: "Intégration du résultat", color: "text-sky-700", bg: "bg-sky-50/60 border-sky-200", badge: "bg-sky-100 text-sky-700 border-sky-200", border: "border-sky-200" },
  "99": { label: "Classe 99", full: "Contrepartie réfléchissement", color: "text-slate-700", bg: "bg-slate-50/60 border-slate-200", badge: "bg-slate-100 text-slate-700 border-slate-200", border: "border-slate-200" },
};
