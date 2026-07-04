/** Origine de l'écriture analytique autonome. */
export type MethodeSaisieEcritures = "MANUELLE" | "IMPORT_CG";
export type OrigineEcritureAnalytique = MethodeSaisieEcritures;

export type StatutEcritureAnalytique = "BROUILLON" | "VALIDEE" | "REJETEE";

export interface NatureChargeAnalytique {
    id: string;
    code: string;
    libelle: string;
}

export interface LigneEcritureAnalytique {
    centreId: string;
    natureChargeId: string;
    montant: number;
    libelle?: string;
}

export interface EcritureAnalytique {
    id: string;
    statut: StatutEcritureAnalytique;
    origine: MethodeSaisieEcritures;
    createdAt: string;
    validatedAt?: string;
    rejectReason?: string;

    journalId: string;
    dateEffet: string;
    numeroPiece: string;
    libelleOperation: string;

    centreSourceId?: string;
    centreDestinationId: string;
    axeId: string;
    exerciceAnalytiqueId: string;

    natureChargeId: string;
    montant: number;
    quantiteUO?: number;

    /** Lignes d'imputation (+ / −) générées à l'enregistrement. */
    lignes: LigneEcritureAnalytique[];

    ligneCGRef?: string;
}

/** Natures de charge (comptes classe 6 / réfléchis CA). */
export const NATURES_CHARGE: NatureChargeAnalytique[] = [
    { id: "605100", code: "605100", libelle: "Énergie et Électricité" },
    { id: "606100", code: "606100", libelle: "Électricité" },
    { id: "601000", code: "601000", libelle: "Achats de matières premières" },
    { id: "641100", code: "641100", libelle: "Salaires et appointements" },
    { id: "613200", code: "613200", libelle: "Locations immobilières" },
    { id: "681000", code: "681000", libelle: "Dotations aux amortissements" },
];

export function generateNumeroPiece(year = new Date().getFullYear(), seq?: number): string {
    const next = seq ?? Math.floor(Math.random() * 9000) + 1000;
    return `ECRIT-ANALYTIQUE-${year}-${String(next).padStart(4, "0")}`;
}

// Réexport des types journaux
export type {
    JournalAnalytiqueConfig,
    TypeJournalAnalytique,
    ExigenceCentreSource,
} from "@/lib/analytique/journal-analytique";

export {
    TYPE_JOURNAL_LABELS,
    COMPTES_REFLET_CLASSE_90,
    DEFAULT_JOURNAUX_ANALYTIQUES,
    journalAfficheCentreSource,
    journalCentreSourceObligatoire,
    generateJournalCode,
} from "@/lib/analytique/journal-analytique";

export {
    listJournauxAnalytiques,
    listJournauxAnalytiquesActifs,
    getJournalAnalytiqueById,
} from "@/lib/analytique/journaux-analytiques-store";
