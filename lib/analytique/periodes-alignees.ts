import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import type { ExerciceComptableDto } from "@/src/lib2/models/ExerciceComptableDto";
import type { PeriodeAnalytique, PeriodeCG, StatutPeriode, ExerciceCG } from "@/lib/analytique/mock-data";

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** Libellé lisible à partir du code période CG (ex. 2026-03 → Mars 2026). */
export function libellePeriodeFromCode(code: string): string {
  const match = code.match(/^(\d{4})-(\d{2})$/);
  if (!match) return code;
  const month = Number.parseInt(match[2], 10);
  if (month < 1 || month > 12) return code;
  return `${MOIS_FR[month - 1]} ${match[1]}`;
}

/** Statut analytique dérivé des dates et de la clôture CG (règle par défaut). */
export function deriveStatutPeriodeAnalytique(
  dateDebut: string,
  dateFin: string,
  cloturee: boolean,
): StatutPeriode {
  if (cloturee) return "CLOTURE";
  const now = new Date();
  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  if (now >= start && now <= end) return "EN_COURS";
  return "OUVERT";
}

/** Vue analytique 1:1 d'une période comptable (même id, mêmes dates). */
export function mapPeriodeComptableToAnalytique(
  p: PeriodeComptableDto,
  statutOverride?: StatutPeriode,
): PeriodeAnalytique {
  const id = p.id ?? p.code;
  const statut =
    statutOverride ??
    deriveStatutPeriodeAnalytique(p.dateDebut, p.dateFin, p.cloturee);
  return {
    id,
    periodeCGId: id,
    exerciceId: p.exercice_id ?? "",
    libelle: libellePeriodeFromCode(p.code),
    dateDebut: p.dateDebut,
    dateFin: p.dateFin,
    statut,
  };
}

/** Vue analytique 1:1 d'une période CG mock (même id). */
export function mapPeriodeCGToAnalytique(
  cg: PeriodeCG,
  statutOverride?: StatutPeriode,
): PeriodeAnalytique {
  const statut =
    statutOverride ??
    deriveStatutPeriodeAnalytique(cg.dateDebut, cg.dateFin, cg.cloturee);
  return {
    id: cg.id,
    periodeCGId: cg.id,
    exerciceId: cg.exerciceCGId,
    libelle: cg.libelle,
    dateDebut: cg.dateDebut,
    dateFin: cg.dateFin,
    statut,
  };
}

export function mapExerciceComptableToCG(e: ExerciceComptableDto): ExerciceCG {
  return {
    id: e.id ?? "",
    code: e.code ?? "",
    libelle: e.libelle ?? e.code ?? "",
    dateDebut: e.date_debut ?? "",
    dateFin: e.date_fin ?? "",
    cloture: e.cloture ?? false,
    statut: e.cloture ? "CLOTURE" : "OUVERT",
  };
}

/** Résout la période CG associée (identique par défaut). */
export function resolvePeriodeCG(
  periode: PeriodeAnalytique,
  periodesCG: PeriodeCG[],
): PeriodeCG | undefined {
  const cgId = periode.periodeCGId || periode.id;
  return periodesCG.find((p) => p.id === cgId);
}

/** Période CA désynchronisée si la CG est clôturée mais pas le statut CA. */
export function isPeriodeDesynchronisee(
  periode: PeriodeAnalytique,
  periodesCG: PeriodeCG[],
): boolean {
  const cg = resolvePeriodeCG(periode, periodesCG);
  return !!cg?.cloturee && periode.statut !== "CLOTURE";
}

/** Exercice comptable encore ouvert (non clôturé). */
export function isExerciceComptableOuvert(e: ExerciceComptableDto): boolean {
  return !e.cloture;
}

/** Exercice analytique courant = exercice CG ouvert (actif en priorité). */
export function getExerciceAnalytiqueOuvert(
  exercices: ExerciceComptableDto[],
): ExerciceComptableDto | undefined {
  const ouverts = exercices.filter(isExerciceComptableOuvert);
  return ouverts.find((e) => e.actif) ?? ouverts[0];
}

/** Période analytique encore ouverte (non clôturée). */
export function isPeriodeAnalytiqueOuverte(p: PeriodeAnalytique): boolean {
  return p.statut !== "CLOTURE";
}

/** Période analytique en cours : EN_COURS, sinon première période ouverte. */
export function getPeriodeAnalytiqueEnCours(
  periodes: PeriodeAnalytique[],
): PeriodeAnalytique | undefined {
  const enCours = periodes.find((p) => p.statut === "EN_COURS");
  if (enCours) return enCours;
  return periodes
    .filter(isPeriodeAnalytiqueOuverte)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))[0];
}
