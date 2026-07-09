import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";

export type StatutPeriodeComptable = "CLOTURE" | "EN_COURS" | "OUVERT";

export type PeriodeComptableLike = {
    id?: string;
    code: string;
    cloturee: boolean;
    dateDebut: string;
    dateFin: string;
};

function toDateOnly(value: string | Date): Date {
    const date = typeof value === "string" ? new Date(value) : value;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Vérifie si une date tombe dans l'intervalle [dateDebut, dateFin] (inclus). */
export function isDateInPeriode(
    date: Date,
    dateDebut: string,
    dateFin: string,
): boolean {
    if (!dateDebut || !dateFin) return false;
    const d = toDateOnly(date);
    const start = toDateOnly(dateDebut);
    const end = toDateOnly(dateFin);
    return d >= start && d <= end;
}

export function deriveStatutPeriodeComptable(p: PeriodeComptableLike): StatutPeriodeComptable {
    if (p.cloturee) return "CLOTURE";
    if (isDateInPeriode(new Date(), p.dateDebut, p.dateFin)) return "EN_COURS";
    return "OUVERT";
}

function sortPeriodesByCode<T extends PeriodeComptableLike>(periodes: T[]): T[] {
    return [...periodes].sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));
}

/** Tri chronologique par code — pour listes d'administration (page périodes). */
export function triPeriodesComptablesParCode<T extends PeriodeComptableLike>(periodes: T[]): T[] {
    return sortPeriodesByCode(periodes);
}

function isPeriodeValide(p: PeriodeComptableLike): boolean {
    return Boolean(p.code && p.dateDebut && p.dateFin);
}

function resolvePeriodeId(p: PeriodeComptableLike): string {
    return p.id ?? p.code;
}

/** Période chronologiquement suivante (par code), après une période donnée. */
export function getPeriodeComptableSuivante<T extends PeriodeComptableLike>(
    periodes: T[],
    afterPeriodId: string,
): T | null {
    const sorted = sortPeriodesByCode(periodes);
    const idx = sorted.findIndex((p) => resolvePeriodeId(p) === afterPeriodId);
    if (idx < 0 || idx >= sorted.length - 1) return null;
    return sorted[idx + 1];
}

/**
 * Après clôture : marque la période clôturée et ouvre la suivante si aucune n'est ouverte.
 * Retourne la liste mise à jour (optimiste, cache offline).
 */
export function advancePeriodsAfterClose<T extends PeriodeComptableLike>(
    periodes: T[],
    closedPeriodId: string,
): T[] {
    const updated = periodes.map((p) =>
        resolvePeriodeId(p) === closedPeriodId ? { ...p, cloturee: true } : p,
    );

    if (updated.some((p) => !p.cloturee)) {
        return updated;
    }

    const next = getPeriodeComptableSuivante(periodes, closedPeriodId);
    if (!next) return updated;

    const nextId = resolvePeriodeId(next);
    return updated.map((p) =>
        resolvePeriodeId(p) === nextId ? { ...p, cloturee: false } : p,
    );
}

/**
 * Période unique visible pour l'utilisateur (CG et CA alignés) :
 * 1. Période en cours (date du jour dans l'intervalle, non clôturée)
 * 2. Sinon la seule période non clôturée (règle métier : une seule ouverte)
 * 3. Sinon la période non clôturée la plus proche de la date du jour
 * 4. Sinon la dernière période clôturée (consultation historique)
 */
export function getPeriodeComptableCourante<T extends PeriodeComptableLike>(
    periodes: T[],
): T | null {
    const valides = periodes.filter(isPeriodeValide);
    if (!valides.length) return null;

    const sorted = sortPeriodesByCode(valides);
    const now = new Date();

    const enCours = sorted.find(
        (p) => !p.cloturee && isDateInPeriode(now, p.dateDebut, p.dateFin),
    );
    if (enCours) return enCours;

    const ouvertes = sorted.filter((p) => !p.cloturee);
    if (ouvertes.length >= 1) return ouvertes[0];

    const cloturees = sorted.filter((p) => p.cloturee);
    return cloturees[cloturees.length - 1] ?? null;
}

/** Retourne 0 ou 1 période — celle visible par l'utilisateur. */
export function getPeriodesVisiblesUtilisateur<T extends PeriodeComptableLike>(
    periodes: T[],
): T[] {
    const courante = getPeriodeComptableCourante(periodes);
    return courante ? [courante] : [];
}
