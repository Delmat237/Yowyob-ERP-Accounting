import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";

export type StatutPeriodeComptable = "CLOTURE" | "EN_COURS" | "OUVERT";

export type PeriodeComptableLike = {
    id?: string;
    code: string;
    cloturee: boolean;
    dateDebut: string;
    dateFin: string;
};

/** Normalise une date API / cache (string ISO, Date, tableau Java, objet LocalDate). */
export function parsePeriodeDateValue(value: unknown): string | null {
    if (value == null) return null;

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? null : trimmed.slice(0, 10);
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    }

    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value;
        if (typeof year === "number" && typeof month === "number" && typeof day === "number") {
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
    }

    if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        const year = record.year ?? record.YEAR;
        const month = record.monthValue ?? record.month ?? record.MONTH;
        const day = record.dayOfMonth ?? record.day ?? record.DAY_OF_MONTH;
        if (typeof year === "number" && typeof month === "number" && typeof day === "number") {
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
    }

    return null;
}

/** Unifie camelCase / snake_case issus de l'API ou d'IndexedDB. */
export function normalizePeriodeComptableLike(
    raw: Record<string, unknown>,
): PeriodeComptableLike | null {
    const code = typeof raw.code === "string" ? raw.code : "";
    const dateDebut = parsePeriodeDateValue(raw.dateDebut ?? raw.date_debut);
    const dateFin = parsePeriodeDateValue(raw.dateFin ?? raw.date_fin);
    if (!code || !dateDebut || !dateFin) return null;

    return {
        id: typeof raw.id === "string" ? raw.id : undefined,
        code,
        cloturee: Boolean(raw.cloturee),
        dateDebut,
        dateFin,
    };
}

function toDateOnly(value: string | Date): Date | null {
    const date = typeof value === "string" ? new Date(value) : value;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
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
    if (!d || !start || !end) return false;
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

function coercePeriodeList<T extends PeriodeComptableLike>(periodes: T[]): PeriodeComptableLike[] {
    return periodes
        .map((p) => normalizePeriodeComptableLike(p as unknown as Record<string, unknown>))
        .filter((p): p is PeriodeComptableLike => p !== null);
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
    const valides = coercePeriodeList(periodes);
    if (!valides.length) return null;

    const sorted = sortPeriodesByCode(valides);
    const now = new Date();

    const enCours = sorted.find(
        (p) => !p.cloturee && isDateInPeriode(now, p.dateDebut, p.dateFin),
    );
    if (enCours) {
        const original = periodes.find(
            (p) => (p.id ?? p.code) === (enCours.id ?? enCours.code),
        );
        return (original ?? enCours) as T;
    }

    const ouvertes = sorted.filter((p) => !p.cloturee);
    if (ouvertes.length >= 1) {
        const pick = ouvertes[0];
        const original = periodes.find((p) => (p.id ?? p.code) === (pick.id ?? pick.code));
        return (original ?? pick) as T;
    }

    const cloturees = sorted.filter((p) => p.cloturee);
    const pick = cloturees[cloturees.length - 1] ?? null;
    if (!pick) return null;
    const original = periodes.find((p) => (p.id ?? p.code) === (pick.id ?? pick.code));
    return (original ?? pick) as T;
}

/** Retourne 0 ou 1 période — celle visible par l'utilisateur. */
export function getPeriodesVisiblesUtilisateur<T extends PeriodeComptableLike>(
    periodes: T[],
): T[] {
    const courante = getPeriodeComptableCourante(periodes);
    return courante ? [courante] : [];
}
