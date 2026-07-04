export type TypeJournalAnalytique =
    | "OPERATIONS_DIRECTES"
    | "VIREMENTS_RECLASSEMENTS"
    | "CHARGES_SUPPLEMENTAIRES";

export type ExigenceCentreSource = "OPTIONNELLE" | "OBLIGATOIRE" | "DESACTIVEE";

export interface JournalAnalytiqueConfig {
    id: string;
    code: string;
    libelle: string;
    type: TypeJournalAnalytique;
    exigenceCentreSource: ExigenceCentreSource;
    /** Compte classe 90 — reflet / contrepartie par défaut */
    compteRefletDefaut?: string;
    actif: boolean;
}

export const TYPE_JOURNAL_LABELS: Record<TypeJournalAnalytique, string> = {
    OPERATIONS_DIRECTES: "Opérations Directes",
    VIREMENTS_RECLASSEMENTS: "Virements / Reclassements Inter-Centres",
    CHARGES_SUPPLEMENTAIRES: "Charges Supplétives",
};

export const COMPTES_REFLET_CLASSE_90 = [
    { code: "900000", libelle: "Contrepartie analytique" },
    { code: "906061", libelle: "Charges réfléchies - Électricité" },
    { code: "906411", libelle: "Charges réfléchies - Salaires" },
    { code: "906132", libelle: "Charges réfléchies - Loyers" },
];

export const DEFAULT_JOURNAUX_ANALYTIQUES: JournalAnalytiqueConfig[] = [
    {
        id: "jal_reclass",
        code: "JAL_RECLASS",
        libelle: "Journal des Reclassements Internes",
        type: "VIREMENTS_RECLASSEMENTS",
        exigenceCentreSource: "OBLIGATOIRE",
        compteRefletDefaut: "900000",
        actif: true,
    },
    {
        id: "jal_charge",
        code: "JAL_CHARGE",
        libelle: "Journal des charges directes",
        type: "OPERATIONS_DIRECTES",
        exigenceCentreSource: "DESACTIVEE",
        compteRefletDefaut: "900000",
        actif: true,
    },
    {
        id: "jal_ventil",
        code: "JAL_VENTIL",
        libelle: "Journal de Ventilation",
        type: "OPERATIONS_DIRECTES",
        exigenceCentreSource: "DESACTIVEE",
        actif: true,
    },
    {
        id: "jal_supplet",
        code: "JAL_SUPPL",
        libelle: "Journal des charges supplétives",
        type: "CHARGES_SUPPLEMENTAIRES",
        exigenceCentreSource: "OPTIONNELLE",
        compteRefletDefaut: "900000",
        actif: true,
    },
];

export function journalAfficheCentreSource(journal: JournalAnalytiqueConfig): boolean {
    return journal.exigenceCentreSource !== "DESACTIVEE";
}

export function journalCentreSourceObligatoire(journal: JournalAnalytiqueConfig): boolean {
    return journal.exigenceCentreSource === "OBLIGATOIRE";
}

export function generateJournalCode(): string {
    return `JAL_${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
