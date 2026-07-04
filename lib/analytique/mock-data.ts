// ─── Types CA ─────────────────────────────────────────────────────────────────
export type TypeAxe = "PRINCIPAL" | "AUXILIAIRE";
export type TypeCentre =
    | "CENTRE_TRAVAIL"
    | "CENTRE_RESPONSABILITE"
    | "CENTRE_PROFITS"
    | "CENTRE_RENTABILITE"
    | "CENTRE_AUXILIAIRE"
    | "CENTRE_PRINCIPAL";
export type MethodeStock = "CUMP" | "FIFO" | "LIFO";
export type StatutPeriode = "OUVERT" | "EN_COURS" | "CLOTURE";

export type { ClasseAnalytique } from "@/lib/analytique/classes-analytiques";
export { CLASSES_ANALYTIQUES } from "@/lib/analytique/classes-analytiques";

// ─── Types miroir Comptabilité Générale (Yowyob-ERP-Accounting) ───────────────
// Ces types reproduisent ExerciceComptableDto, PeriodeComptableDto et
// PlanComptableDto de l'API CG. En production ils viendraient via un appel
// à l'API du module CG ; ici ils sont simulés pour le frontend analytique.

export interface ExerciceCG {
    id: string;
    code: string;           // ex: "EX-2026"
    libelle: string;        // ex: "Exercice 2026"
    dateDebut: string;
    dateFin: string;
    cloture: boolean;
    statut: "OUVERT" | "CLOTURE";
}

/** Période de la CG — format code YYYY-MM, liée à un exercice CG */
export interface PeriodeCG {
    id: string;
    code: string;           // ex: "2026-03" (format YYYY-MM)
    libelle: string;        // ex: "Mars 2026"
    dateDebut: string;
    dateFin: string;
    cloturee: boolean;
    exerciceCGId: string;   // FK → ExerciceCG.id
    /** Résultat net CG calculé pour cette période (produits - charges) */
    resultatNet: number;
    /** Montant total des charges enregistrées en CG cette période */
    totalChargesCG: number;
    /** Montant total des produits enregistrés en CG cette période */
    totalProduitsCG: number;
}

/** Compte du plan comptable général OHADA */
export interface CompteCG {
    id: string;
    noCompte: string;       // ex: "601", "641", "661"
    libelle: string;
    classe: number;         // 1–9 OHADA (6 = charges, 7 = produits)
    /** true = peut transiter en CA ; false = reste uniquement en CG */
    incorporable: boolean;
    actif: boolean;
    /** Catégorie concordance : charges supplétives, non incorporables… */
    categorieConc?: "NON_INC_CHARGE" | "NON_INC_PRODUIT" | "SUPPLETIVE" | "NORMALE";
}

// ─── Types CA ─────────────────────────────────────────────────────────────────


/** Type de section (classe 92) — ordre de répartition, sections homogènes. */
export type TypeSectionHomogene =
    | "CENTRE_AUXILIAIRE"
    | "CENTRE_PRINCIPAL"
    | "CENTRE_STRUCTURE";

export const TYPE_SECTION_LABELS: Record<TypeSectionHomogene, string> = {
    CENTRE_AUXILIAIRE: "Centre auxiliaire",
    CENTRE_PRINCIPAL: "Centre principal",
    CENTRE_STRUCTURE: "Centre de structure",
};

export interface CompteAnalytique {
    id: string;
    numero: string;         // ex: "906061", "923100"
    libelle: string;        // ex: "Charges réfléchies - Électricité", "Atelier Production"
    classe: ClasseAnalytique;
    actif: boolean;
    description?: string;
    /** Classe 92 — type de section pour la méthode des sections homogènes */
    typeSection?: TypeSectionHomogene;
    /** Classe 90 — numéro du compte CG miroir (liaison structurée CG ↔ CA) */
    compteCGMiroir?: string;
    /** Plan analytique — période de validité du compte dans la nomenclature */
    dateDebut?: string;
    dateFin?: string;
}


export interface AxeAnalytique {
    id: string;
    code: string;
    libelle: string;
    type: TypeAxe;
    parentId?: string;
    actif: boolean;
    compteAnalytique9x?: string;
    uniteOeuvreId?: string;
    dateDebut?: string;
    dateFin?: string;
    description?: string;
}

export interface CentreAnalyse {
    id: string;
    code: string;
    libelle: string;
    nature: TypeCentre;
    uniteOeuvre: string;
    assietteFrais?: string;
    axeId: string; // Gardé pour compatibilité, mais on privilégiera le compte 92
    compteAnalytiqueId?: string; // Lien direct vers un compte de Classe 92
    actif: boolean;
    responsable?: string;
    budgetAlloue?: number;
    typePrestation?: "INTERNE" | "EXTERNE";
    exerciceId?: string;
    periodeId?: string;
}

export interface GlobalConfigAnalytique {
    devise: string;
    precision: number;       // nb decimales
    separateurMilliers: string;
    bloquerApresClotureCG: boolean;
    joursGraceCloture: number; // jours pour clore CA apres CG
    autoriserSaisieRetroactive: boolean;
    methodeValorisationStocks: MethodeStock;
}

export const mockGlobalConfig: GlobalConfigAnalytique = {
    devise: "FCFA",
    precision: 0,
    separateurMilliers: " ",
    bloquerApresClotureCG: true,
    joursGraceCloture: 5,
    autoriserSaisieRetroactive: false,
    methodeValorisationStocks: "CUMP",
};

export interface ChargeAnalytique {
    id: string;
    nature: string;
    montant: number;
    type: "DIRECTE" | "INDIRECTE";
    incorporable: boolean;
    centreId: string;
    periodeId: string;
    description?: string;
}

export interface PeriodeAnalytique {
    id: string;
    libelle: string;
    dateDebut: string;
    dateFin: string;
    statut: StatutPeriode;
    /** Exercice comptable (même référence que la CG : exercice_id). */
    exerciceId: string;
    /**
     * Référence période CG — identique à `id` par défaut (alignement 1:1).
     * Conservé pour flexibilité future (exception métier).
     */
    periodeCGId: string;
}

export interface CoutProduit {
    id: string;
    produitCode: string;
    produitLibelle: string;
    coutAchat: number;
    coutProduction: number;
    coutRevient: number;
    methodeStock: MethodeStock;
    periodeId: string;
}

export interface EcartAnalyse {
    libelle: string;
    quantiteReelle: number;
    quantitePreetablie: number;
    prixReel: number;
    prixPreetabli: number;
    ecartGlobal: number;
    ecartQuantite: number;
    ecartPrix: number;
}

// ─── Budget ───────────────────────────────────────────────────────────────────
export type StatutBudget = "BROUILLON" | "VALIDE" | "REVISE";

export interface LigneBudget {
    id: string;
    centreId: string;
    axeId: string;
    nature: string;
    montantBudget: number;
    montantReel: number;
    periodeId: string;
}

export interface BudgetAnalytique {
    id: string;
    libelle: string;
    exercice: string;
    periodeId: string;
    statut: StatutBudget;
    lignes: LigneBudget[];
}

// ─── Ventilation multi-axes ───────────────────────────────────────────────────
export interface VentilationAxe {
    axeId: string;
    centreId: string;
    pourcentage: number; // 0-100, somme doit = 100
}

export interface ChargeVentilee {
    id: string;
    chargeSourceId: string; // réf. à une écriture de la CG
    compteCG: string;       // noCompte CG source (ex: "601", "641")
    libelle: string;
    montantTotal: number;
    incorporable: boolean;
    periodeId: string;      // période analytique
    periodeCGId: string;    // période CG source (traçabilité)
    ventilations: VentilationAxe[];
}

// ─── Concordance CG/CA ────────────────────────────────────────────────────────
export type TypeDifference =
    | "CHARGE_NON_INC"
    | "PRODUIT_NON_INC"
    | "CHARGE_SUPPLETIVE"
    | "PRODUIT_SUPPLETIF"
    | "DIFF_AMORT"
    | "DIFF_IMPUTATION"
    | "DIFF_INVENTAIRE";

export interface LigneConcordance {
    id: string;
    type: TypeDifference;
    label: string;
    description: string;
    /** "+" = s'ajoute au résultat CG pour obtenir le résultat CA */
    signe: "+" | "-";
    montant: number;
    /** Si lié à une charge ventilée, référence son id */
    chargeVentileeId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Data — Comptabilité Générale (simulée)
// ═══════════════════════════════════════════════════════════════════════════════

export const mockExercicesCG: ExerciceCG[] = [
    {
        id: "cg-ex-2025",
        code: "EX-2025",
        libelle: "Exercice 2025",
        dateDebut: "2025-01-01",
        dateFin: "2025-12-31",
        cloture: true,
        statut: "CLOTURE",
    },
    {
        id: "cg-ex-2026",
        code: "EX-2026",
        libelle: "Exercice 2026",
        dateDebut: "2026-01-01",
        dateFin: "2026-12-31",
        cloture: false,
        statut: "OUVERT",
    },
];

export const mockPeriodesCG: PeriodeCG[] = [
    {
        id: "cg-p1",
        code: "2026-01",
        libelle: "Janvier 2026",
        dateDebut: "2026-01-01",
        dateFin: "2026-01-31",
        cloturee: true,
        exerciceCGId: "cg-ex-2026",
        resultatNet: 1200000,
        totalChargesCG: 5100000,
        totalProduitsCG: 6300000,
    },
    {
        id: "cg-p2",
        code: "2026-02",
        libelle: "Février 2026",
        dateDebut: "2026-02-01",
        dateFin: "2026-02-28",
        cloturee: true,
        exerciceCGId: "cg-ex-2026",
        resultatNet: 1350000,
        totalChargesCG: 5350000,
        totalProduitsCG: 6700000,
    },
    {
        id: "cg-p3",
        code: "2026-03",
        libelle: "Mars 2026",
        dateDebut: "2026-03-01",
        dateFin: "2026-03-31",
        cloturee: false,
        exerciceCGId: "cg-ex-2026",
        resultatNet: 1500000,
        totalChargesCG: 5600000,
        totalProduitsCG: 7100000,
    },
    {
        id: "cg-p4",
        code: "2026-04",
        libelle: "Avril 2026",
        dateDebut: "2026-04-01",
        dateFin: "2026-04-30",
        cloturee: false,
        exerciceCGId: "cg-ex-2026",
        resultatNet: 0,
        totalChargesCG: 0,
        totalProduitsCG: 0,
    },
    {
        id: "cg-p5",
        code: "2026-05",
        libelle: "Mai 2026",
        dateDebut: "2026-05-01",
        dateFin: "2026-05-31",
        cloturee: false,
        exerciceCGId: "cg-ex-2026",
        resultatNet: 0,
        totalChargesCG: 0,
        totalProduitsCG: 0,
    },
    {
        id: "cg-p6",
        code: "2026-06",
        libelle: "Juin 2026",
        dateDebut: "2026-06-01",
        dateFin: "2026-06-30",
        cloturee: false,
        exerciceCGId: "cg-ex-2026",
        resultatNet: 0,
        totalChargesCG: 0,
        totalProduitsCG: 0,
    },
];

/** Plan comptable OHADA — comptes de charges (classe 6) et règles d'incorporabilité */
export const mockPlanComptableCG: CompteCG[] = [
    // Classe 6 — Charges
    { id: "cg-c601", noCompte: "601", libelle: "Achats de matières premières", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c602", noCompte: "602", libelle: "Achats de matières consommables", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c606", noCompte: "606", libelle: "Achats non stockés / énergie", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c611", noCompte: "611", libelle: "Sous-traitance générale", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c613", noCompte: "613", libelle: "Locations", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c641", noCompte: "641", libelle: "Rémunérations du personnel", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c645", noCompte: "645", libelle: "Charges sociales", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c681", noCompte: "681", libelle: "Dotations aux amortissements (exploitation)", classe: 6, incorporable: true, actif: true, categorieConc: "NORMALE" },
    // Non incorporables
    { id: "cg-c661", noCompte: "661", libelle: "Charges d'intérêts", classe: 6, incorporable: false, actif: true, categorieConc: "NON_INC_CHARGE" },
    { id: "cg-c665", noCompte: "665", libelle: "Escomptes accordés", classe: 6, incorporable: false, actif: true, categorieConc: "NON_INC_CHARGE" },
    { id: "cg-c671", noCompte: "671", libelle: "Pertes exceptionnelles", classe: 6, incorporable: false, actif: true, categorieConc: "NON_INC_CHARGE" },
    { id: "cg-c695", noCompte: "695", libelle: "Impôts sur les bénéfices", classe: 6, incorporable: false, actif: true, categorieConc: "NON_INC_CHARGE" },
    // Classe 7 — Produits
    { id: "cg-c701", noCompte: "701", libelle: "Ventes de marchandises", classe: 7, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c706", noCompte: "706", libelle: "Prestations de services", classe: 7, incorporable: true, actif: true, categorieConc: "NORMALE" },
    { id: "cg-c775", noCompte: "775", libelle: "Plus-values de cession d'actifs", classe: 7, incorporable: false, actif: true, categorieConc: "NON_INC_PRODUIT" },
    { id: "cg-c781", noCompte: "781", libelle: "Reprises sur amortissements", classe: 7, incorporable: false, actif: true, categorieConc: "NON_INC_PRODUIT" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Data — Comptabilité Analytique
// ═══════════════════════════════════════════════════════════════════════════════

export const mockComptesAnalytiques: CompteAnalytique[] = [
    // Comptes de Réfléchissement (90)
    { id: "c1", numero: "906061", libelle: "Charges réfléchies - Électricité", classe: "90", actif: true, compteCGMiroir: "606100" },
    { id: "c2", numero: "906070", libelle: "Charges réfléchies - Achats de marchandises", classe: "90", actif: true, compteCGMiroir: "607000" },
    { id: "c3", numero: "906132", libelle: "Charges réfléchies - Loyers", classe: "90", actif: true, compteCGMiroir: "613200" },
    { id: "c4", numero: "906411", libelle: "Charges réfléchies - Salaires", classe: "90", actif: true, compteCGMiroir: "641100" },

    // Comptes de Sections (Centres de Coûts) (92)
    { id: "c5", numero: "921000", libelle: "Section - Direction Générale", classe: "92", actif: true, typeSection: "CENTRE_STRUCTURE" },
    { id: "c6", numero: "922000", libelle: "Section - Activité Vélos", classe: "92", actif: true, typeSection: "CENTRE_PRINCIPAL" },
    { id: "c7", numero: "922100", libelle: "Section - Activité Trottinettes", classe: "92", actif: true, typeSection: "CENTRE_PRINCIPAL" },
    { id: "c8", numero: "923100", libelle: "Section - Atelier Production", classe: "92", actif: true, typeSection: "CENTRE_AUXILIAIRE" },

    // Comptes d'Inventaire Permanent (94)
    { id: "c9", numero: "941000", libelle: "Stocks de matières premières", classe: "94", actif: true },
    { id: "c10", numero: "945100", libelle: "Stocks - Vélos", classe: "94", actif: true },
    { id: "c11", numero: "945200", libelle: "Stocks - Trottinettes", classe: "94", actif: true },

    // Comptes de Résultats Analytiques (97)
    { id: "c12", numero: "971000", libelle: "Résultat Analytique - Vélos", classe: "97", actif: true },
    { id: "c13", numero: "972000", libelle: "Résultat Analytique - Trottinettes", classe: "97", actif: true },
];

export const mockAxes: AxeAnalytique[] = [
    {
        id: "1", code: "AXE-DEPT", libelle: "Département", type: "PRINCIPAL", actif: true,
        compteAnalytique9x: "9100", uniteOeuvreId: "uo1", dateDebut: "2026-01-01", description: "Ventilation des coûts par département",
    },
    {
        id: "2", code: "AXE-PROJ", libelle: "Projet", type: "PRINCIPAL", actif: true,
        compteAnalytique9x: "9200", uniteOeuvreId: "uo2", dateDebut: "2026-01-01", description: "Suivi des coûts par projet",
    },
    {
        id: "3", code: "AXE-PROD", libelle: "Produit", type: "AUXILIAIRE", actif: true,
        compteAnalytique9x: "9300", dateDebut: "2026-01-01", description: "Analyse des coûts par ligne de produit",
    }
];

export const mockCentres: CentreAnalyse[] = [
    {
        id: "c1", code: "CENT-PROD", libelle: "Production", nature: "CENTRE_PRINCIPAL",
        uniteOeuvre: "Heure Machine", axeId: "1", actif: true,
        compteAnalytiqueId: "c8", // 923100 Atelier Production
        responsable: "Jean Martin", budgetAlloue: 5000000, typePrestation: "INTERNE"
    },
    {
        id: "c2", code: "CENT-DIST", libelle: "Distribution", nature: "CENTRE_PRINCIPAL",
        uniteOeuvre: "Unité vendue", axeId: "1", actif: true,
        compteAnalytiqueId: "c7", // 922100 Activité Trottinettes (simplifié pour le mock)
        responsable: "Alice Dubois", budgetAlloue: 2000000, typePrestation: "EXTERNE"
    },
    {
        id: "c3", code: "CENT-ADM", libelle: "Bureau Administration", nature: "CENTRE_PRINCIPAL",
        uniteOeuvre: "Montant comptabilité générale", axeId: "1", actif: true,
        compteAnalytiqueId: "c5", // 921000 Direction Générale
        responsable: "Directeur Financier", budgetAlloue: 1500000, typePrestation: "INTERNE"
    },
    { id: "c4", code: "CENT-ENT", libelle: "Entretien", nature: "CENTRE_AUXILIAIRE", uniteOeuvre: "Heure travail", axeId: "1", actif: true },
    { id: "c5", code: "CENT-LOG", libelle: "Logistique", nature: "CENTRE_AUXILIAIRE", uniteOeuvre: "Km parcouru", axeId: "2", actif: true },
];

export const mockCharges: ChargeAnalytique[] = [
    { id: "ch1", nature: "Matières premières", montant: 2500000, type: "DIRECTE", incorporable: true, centreId: "c1", periodeId: "cg-p1" },
    { id: "ch2", nature: "Main d'œuvre directe", montant: 1800000, type: "DIRECTE", incorporable: true, centreId: "c1", periodeId: "cg-p1" },
    { id: "ch3", nature: "Électricité", montant: 450000, type: "INDIRECTE", incorporable: true, centreId: "c4", periodeId: "cg-p1" },
    { id: "ch4", nature: "Amortissements", montant: 320000, type: "INDIRECTE", incorporable: true, centreId: "c3", periodeId: "cg-p1" },
    { id: "ch5", nature: "Frais de publicité", montant: 180000, type: "INDIRECTE", incorporable: true, centreId: "c2", periodeId: "cg-p1" },
    { id: "ch6", nature: "Charges financières", montant: 95000, type: "INDIRECTE", incorporable: false, centreId: "c3", periodeId: "cg-p1", description: "Non incorporable" },
];

/**
 * Périodes analytiques — alignées 1:1 sur mockPeriodesCG (même id, mêmes dates).
 * Le statut CA peut diverger temporairement avant synchronisation de clôture.
 */
const MOCK_PERIODE_STATUTS: Partial<Record<string, StatutPeriode>> = {
    "cg-p1": "CLOTURE",
    "cg-p2": "CLOTURE",
    "cg-p3": "EN_COURS",
    "cg-p4": "OUVERT",
    "cg-p5": "OUVERT",
    "cg-p6": "OUVERT",
};

export const mockPeriodes: PeriodeAnalytique[] = mockPeriodesCG.map((cg) => {
    const statut =
        MOCK_PERIODE_STATUTS[cg.id] ??
        (cg.cloturee ? "CLOTURE" : "OUVERT");
    return {
        id: cg.id,
        periodeCGId: cg.id,
        exerciceId: cg.exerciceCGId,
        libelle: cg.libelle,
        dateDebut: cg.dateDebut,
        dateFin: cg.dateFin,
        statut,
    };
});

export const mockCoutsProduits: CoutProduit[] = [
    { id: "cp1", produitCode: "PROD-A", produitLibelle: "Produit Alpha", coutAchat: 850000, coutProduction: 1450000, coutRevient: 1850000, methodeStock: "CUMP", periodeId: "cg-p3" },
    { id: "cp2", produitCode: "PROD-B", produitLibelle: "Produit Beta", coutAchat: 620000, coutProduction: 1100000, coutRevient: 1380000, methodeStock: "FIFO", periodeId: "cg-p3" },
    { id: "cp3", produitCode: "PROD-C", produitLibelle: "Produit Gamma", coutAchat: 490000, coutProduction: 820000, coutRevient: 1050000, methodeStock: "CUMP", periodeId: "cg-p3" },
];

// ─── Mock Budgets ─────────────────────────────────────────────────────────────
export const mockBudgets: BudgetAnalytique[] = [
    {
        id: "b1",
        libelle: "Budget Prévisionnel 2026",
        exercice: "2026",
        periodeId: "cg-p3",
        statut: "VALIDE",
        lignes: [
            { id: "bl1", centreId: "c1", axeId: "1", nature: "Matières premières", montantBudget: 3000000, montantReel: 2500000, periodeId: "cg-p3" },
            { id: "bl2", centreId: "c1", axeId: "1", nature: "Main d'œuvre directe", montantBudget: 2000000, montantReel: 1800000, periodeId: "cg-p3" },
            { id: "bl3", centreId: "c2", axeId: "1", nature: "Frais de distribution", montantBudget: 600000, montantReel: 180000, periodeId: "cg-p3" },
            { id: "bl4", centreId: "c3", axeId: "1", nature: "Frais administratifs", montantBudget: 400000, montantReel: 320000, periodeId: "cg-p3" },
            { id: "bl5", centreId: "c4", axeId: "1", nature: "Électricité & énergie", montantBudget: 500000, montantReel: 450000, periodeId: "cg-p3" },
            { id: "bl6", centreId: "c5", axeId: "2", nature: "Transport & logistique", montantBudget: 200000, montantReel: 0, periodeId: "cg-p3" },
        ],
    },
    {
        id: "b2",
        libelle: "Budget Révisé T1 2026",
        exercice: "2026",
        periodeId: "cg-p1",
        statut: "REVISE",
        lignes: [
            { id: "bl7", centreId: "c1", axeId: "1", nature: "Matières premières", montantBudget: 2800000, montantReel: 2500000, periodeId: "cg-p1" },
            { id: "bl8", centreId: "c1", axeId: "1", nature: "Main d'œuvre directe", montantBudget: 1900000, montantReel: 1800000, periodeId: "cg-p1" },
        ],
    },
];

// ─── Mock Charges Ventilées ───────────────────────────────────────────────────
export const mockChargesVentilees: ChargeVentilee[] = [
    {
        id: "cv1",
        chargeSourceId: "cg-ecr-001",
        compteCG: "601",
        libelle: "Achats matières premières - Facture FRS-2026-031",
        montantTotal: 2500000,
        incorporable: true,
        periodeId: "cg-p3",
        periodeCGId: "cg-p3",
        ventilations: [
            { axeId: "1", centreId: "c1", pourcentage: 70 },
            { axeId: "2", centreId: "c5", pourcentage: 30 },
        ],
    },
    {
        id: "cv2",
        chargeSourceId: "cg-ecr-002",
        compteCG: "641",
        libelle: "Salaires & traitements - Paie Mars 2026",
        montantTotal: 1800000,
        incorporable: true,
        periodeId: "cg-p3",
        periodeCGId: "cg-p3",
        ventilations: [
            { axeId: "1", centreId: "c1", pourcentage: 60 },
            { axeId: "1", centreId: "c2", pourcentage: 25 },
            { axeId: "1", centreId: "c3", pourcentage: 15 },
        ],
    },
    {
        id: "cv3",
        chargeSourceId: "cg-ecr-003",
        compteCG: "661",
        libelle: "Charges d'intérêts bancaires - Mars 2026",
        montantTotal: 95000,
        incorporable: false,
        periodeId: "cg-p3",
        periodeCGId: "cg-p3",
        ventilations: [],
    },
    {
        id: "cv4",
        chargeSourceId: "cg-ecr-004",
        compteCG: "606",
        libelle: "Énergie & fluides - Mars 2026",
        montantTotal: 450000,
        incorporable: true,
        periodeId: "cg-p3",
        periodeCGId: "cg-p3",
        ventilations: [
            { axeId: "1", centreId: "c4", pourcentage: 80 },
            { axeId: "1", centreId: "c3", pourcentage: 20 },
        ],
    },
    {
        id: "cv5",
        chargeSourceId: "cg-ecr-005",
        compteCG: "671",
        libelle: "Perte sur créance irrécouvrable - Mars 2026",
        montantTotal: 35000,
        incorporable: false,
        periodeId: "cg-p3",
        periodeCGId: "cg-p3",
        ventilations: [],
    },
];

/**
 * Lignes de concordance pour la période p3 (Mars 2026).
 * Calculées ici manuellement ; la page concordance les recalcule
 * dynamiquement depuis mockChargesVentilees + mockPeriodesCG.
 */
export const mockLignesConcordance: LigneConcordance[] = [
    {
        id: "lc1",
        type: "CHARGE_NON_INC",
        label: "Charges non incorporables",
        description: "661 — Intérêts bancaires + 671 — Perte créance",
        signe: "+",
        montant: 130000,  // 95 000 + 35 000
        chargeVentileeId: "cv3",
    },
    {
        id: "lc2",
        type: "PRODUIT_NON_INC",
        label: "Produits non incorporables",
        description: "775 — Plus-values de cession, 781 — Reprises amort.",
        signe: "-",
        montant: 100000,
    },
    {
        id: "lc3",
        type: "CHARGE_SUPPLETIVE",
        label: "Charges supplétives",
        description: "Rémunération du capital propre, salaire de l'exploitant",
        signe: "-",
        montant: 300000,
    },
    {
        id: "lc4",
        type: "DIFF_AMORT",
        label: "Différences sur amortissements",
        description: "Amortissements analytiques > Amortissements comptables",
        signe: "+",
        montant: 50000,
    },
    {
        id: "lc5",
        type: "DIFF_IMPUTATION",
        label: "Différences d'imputation rationnelle",
        description: "Boni de sur-activité Centre Distribution",
        signe: "-",
        montant: 15000,
    },
    {
        id: "lc6",
        type: "DIFF_INVENTAIRE",
        label: "Différences d'inventaire",
        description: "Malis d'inventaire matières premières",
        signe: "+",
        montant: 25000,
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PARAMÉTRAGE — Types & Mock Data
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Plan Analytique ──────────────────────────────────────────────────────────
export type StatutPlan = "ACTIF" | "ARCHIVE";

export interface PlanAnalytique {
    id: string;
    code: string;
    libelle: string;
    exerciceId: string;   // lié à un exercice CG
    statut: StatutPlan;
    dateCreation: string;
    /** true si des écritures analytiques y sont rattachées (bloque la modification) */
    hasEcritures: boolean;
}

export const mockPlansAnalytiques: PlanAnalytique[] = [
    { id: "plan-2025", code: "PA-2025", libelle: "Plan Analytique 2025", exerciceId: "cg-ex-2025", statut: "ARCHIVE", dateCreation: "2025-01-01", hasEcritures: true },
    { id: "plan-2026", code: "PA-2026", libelle: "Plan Analytique 2026", exerciceId: "cg-ex-2026", statut: "ACTIF", dateCreation: "2026-01-01", hasEcritures: true },
];

// ─── Unités d'Œuvre ───────────────────────────────────────────────────────────
export type NatureUO = "PHYSIQUE" | "MONETAIRE";

export interface UniteOeuvre {
    id: string;
    code: string;           // ex: "HM", "KM", "MOD"
    libelle: string;        // ex: "Heure Machine"
    nature: NatureUO;
    uniteMesure: string;    // ex: "h", "km", "FCFA"
    centresLies: string[];  // FKs → CentreAnalyse.id
    hasCalculs: boolean;    // true = impossible de changer libelle/nature
    description?: string;
    volumePrevuPeriode?: number;
}

export const mockUnitesOeuvre: UniteOeuvre[] = [
    {
        id: "uo1", code: "HM", libelle: "Heure Machine", nature: "PHYSIQUE",
        uniteMesure: "h", centresLies: ["c1"], hasCalculs: true,
        volumePrevuPeriode: 1200, description: "Heures effectives de production machine"
    },
    {
        id: "uo2", code: "KM", libelle: "Kilomètre", nature: "PHYSIQUE",
        uniteMesure: "km", centresLies: ["c5"], hasCalculs: false,
        volumePrevuPeriode: 5000, description: "Distance parcourue par les véhicules de livraison"
    },
    {
        id: "uo3", code: "MOD", libelle: "Main d'œuvre directe", nature: "PHYSIQUE",
        uniteMesure: "h", centresLies: ["c1", "c4"], hasCalculs: true,
        volumePrevuPeriode: 800, description: "Heures de travail ouvrier direct"
    },
    {
        id: "uo4", code: "CHIFF-AFF", libelle: "Chiffre d'Affaires", nature: "MONETAIRE",
        uniteMesure: "FCFA", centresLies: ["c2"], hasCalculs: false,
        volumePrevuPeriode: 10000000, description: "Montant des ventes HT"
    },
];

// ─── Incorporations des Charges ───────────────────────────────────────────────
export type ModeIncorporation = "INCORPORABLE" | "NON_INCORPORABLE" | "SUBSTITUTION";

export interface RegleIncorporation {
    id: string;
    compteCGId: string;     // FK → CompteCG.id
    compteCGNo: string;     // noCompte pour affichage
    libelle: string;
    mode: ModeIncorporation;
    tauxSubstitution?: number;   // % si mode = SUBSTITUTION
    montantSubstitution?: number; // montant fixe si mode = SUBSTITUTION
    baseCalcul?: string;         // description base de calcul
    justification?: string;
    compteEcart97?: string;      // compte analytique 97xx pour l'écart
    periodeId?: string;          // null = toutes périodes
    dateDebut?: string;          // validité debut
    dateFin?: string;            // validité fin
    hasEcritures: boolean;       // bloque suppression
}

export const mockReglesIncorporation: RegleIncorporation[] = [
    { id: "ri1", compteCGId: "cg-c601", compteCGNo: "601", libelle: "Achats matières premières", mode: "INCORPORABLE", hasEcritures: true },
    { id: "ri2", compteCGId: "cg-c641", compteCGNo: "641", libelle: "Rémunérations du personnel", mode: "INCORPORABLE", hasEcritures: true },
    { id: "ri3", compteCGId: "cg-c661", compteCGNo: "661", libelle: "Charges d'intérêts", mode: "NON_INCORPORABLE", justification: "Charge financière exclue des coûts de production", compteEcart97: "9700", hasEcritures: true },
    { id: "ri4", compteCGId: "cg-c671", compteCGNo: "671", libelle: "Pertes exceptionnelles", mode: "NON_INCORPORABLE", justification: "Charge non récurrente", compteEcart97: "9701", hasEcritures: true },
    { id: "ri5", compteCGId: "cg-c681", compteCGNo: "681", libelle: "Dotations aux amortissements", mode: "SUBSTITUTION", tauxSubstitution: 100, baseCalcul: "Valeur économique (amortissement linéaire 10%)", justification: "Remplacement par amortissement économique", compteEcart97: "9710", hasEcritures: false },
    { id: "ri6", compteCGId: "cg-c606", compteCGNo: "606", libelle: "Énergie & fluides", mode: "INCORPORABLE", hasEcritures: true },
];

// ─── Méthode de Valorisation des Stocks ──────────────────────────────────────
export type MethodeValorisation = "CUMP_PERIODE" | "CUMP_ENTREE" | "FIFO" | "LIFO";

export interface RegleValorisationStock {
    id: string;
    familleId: string;      // famille ou article
    familleLibelle: string;
    methode: MethodeValorisation;
    dateApplication: string;
    actif: boolean;
    /** Historique des méthodes précédentes */
    historique: { methode: MethodeValorisation; du: string; au: string }[];
}

export const mockReglesValorisationStock: RegleValorisationStock[] = [
    {
        id: "rvs1",
        familleId: "fam-mp",
        familleLibelle: "Matières Premières",
        methode: "CUMP_ENTREE",
        dateApplication: "2026-01-01",
        actif: true,
        historique: [
            { methode: "CUMP_PERIODE", du: "2025-01-01", au: "2025-12-31" },
        ],
    },
    {
        id: "rvs2",
        familleId: "fam-pf",
        familleLibelle: "Produits Finis",
        methode: "FIFO",
        dateApplication: "2026-01-01",
        actif: true,
        historique: [],
    },
    {
        id: "rvs3",
        familleId: "fam-em",
        familleLibelle: "Emballages",
        methode: "CUMP_PERIODE",
        dateApplication: "2026-01-01",
        actif: true,
        historique: [],
    },
];

// ─── Méthode de Calcul des Coûts ─────────────────────────────────────────────
export type MethodeCalculCout =
    | "COUTS_COMPLETS"
    | "COUTS_VARIABLES"
    | "IMPUTATION_RATIONNELLE"
    | "COUTS_DIRECTS";

export type StatutMethode = "ACTIF" | "ARCHIVE";

export interface ActiviteNormale {
    centreId: string;
    centreLibelle: string;
    activiteNormale: number;  // ex: 1000 heures machine
    unite: string;
}

export interface MethodeCalculCoût {
    id: string;
    methode: MethodeCalculCout;
    planAnalytiqueId: string;
    dateApplication: string;
    statut: StatutMethode;
    /** Rempli uniquement si methode = IMPUTATION_RATIONNELLE */
    activitesNormales: ActiviteNormale[];
    description: string;
}

export const mockMethodesCalcul: MethodeCalculCoût[] = [
    {
        id: "mc1",
        methode: "COUTS_COMPLETS",
        planAnalytiqueId: "plan-2025",
        dateApplication: "2025-01-01",
        statut: "ARCHIVE",
        activitesNormales: [],
        description: "Toutes charges incorporées — résultat analytique complet",
    },
    {
        id: "mc2",
        methode: "COUTS_COMPLETS",
        planAnalytiqueId: "plan-2026",
        dateApplication: "2026-01-01",
        statut: "ACTIF",
        activitesNormales: [],
        description: "Méthode des sections homogènes — exercice 2026",
    },
    {
        id: "mc3",
        methode: "IMPUTATION_RATIONNELLE",
        planAnalytiqueId: "plan-2026",
        dateApplication: "2026-04-01",
        statut: "ARCHIVE",
        activitesNormales: [
            { centreId: "c1", centreLibelle: "Production", activiteNormale: 1000, unite: "H.Mod" },
            { centreId: "c2", centreLibelle: "Distribution", activiteNormale: 500, unite: "Cmds" },
        ],
        description: "Neutralisation des variations d'activité",
    },
];

// ─── Prix de Cessions Internes ────────────────────────────────────────────────
export type MethodeCession = "COUT_COMPLET" | "PRIX_MARCHE" | "PRIX_CONVENTIONNEL";

export interface PrixCessionInterne {
    id: string;
    centreCedantId: string;
    centreCedantLibelle: string;
    centreBeneficiaireId: string;
    centreBeneficiaireLibelle: string;
    prestationLibelle: string;
    methode: MethodeCession;
    prixUnitaire: number;
    uniteId: string;
    uniteLibelle: string;
    dateDebut: string;
    dateFin?: string;
    hasImputations: boolean;
    /** Versions historiques */
    versions: { prixUnitaire: number; du: string; au: string; methode: MethodeCession }[];
}

export const mockPrixCessions: PrixCessionInterne[] = [
    {
        id: "pc1",
        centreCedantId: "c4",
        centreCedantLibelle: "Entretien",
        centreBeneficiaireId: "c1",
        centreBeneficiaireLibelle: "Production",
        prestationLibelle: "Maintenance machines",
        methode: "COUT_COMPLET",
        prixUnitaire: 15000,
        uniteId: "uo4",
        uniteLibelle: "Heure travail",
        dateDebut: "2026-01-01",
        hasImputations: true,
        versions: [
            { prixUnitaire: 12000, du: "2025-01-01", au: "2025-12-31", methode: "COUT_COMPLET" },
        ],
    },
    {
        id: "pc2",
        centreCedantId: "c5",
        centreCedantLibelle: "Logistique",
        centreBeneficiaireId: "c2",
        centreBeneficiaireLibelle: "Distribution",
        prestationLibelle: "Transport produits finis",
        methode: "PRIX_CONVENTIONNEL",
        prixUnitaire: 850,
        uniteId: "uo5",
        uniteLibelle: "Kilomètre parcouru",
        dateDebut: "2026-01-01",
        hasImputations: false,
        versions: [],
    },
];

// ─── Coûts Standards (Préétablis) ─────────────────────────────────────────────
export type ComposanteCout = "MATIERES" | "MOD" | "CHARGES_INDIRECTES";

export interface LigneCoutStandard {
    id: string;
    composante: ComposanteCout;
    centreId?: string;        // pour CHARGES_INDIRECTES
    centreLibelle?: string;
    libelle: string;
    quantiteStandard: number;
    coutUnitaireStandard: number;
    coutStandardTotal: number; // calculé auto : qté × coût unitaire
    activiteNormale?: number;  // pour imputation rationnelle
}

export interface FicheCoutStandard {
    id: string;
    produitCode: string;
    produitLibelle: string;
    periodeRefId: string;     // période sur laquelle le standard est valable
    planAnalytiqueId: string;
    lignes: LigneCoutStandard[];
    /** true si la période a démarré (bloque modification) */
    periodeCommencee: boolean;
}

export const mockFichesCoutStandard: FicheCoutStandard[] = [
    {
        id: "fcs1",
        produitCode: "PROD-A",
        produitLibelle: "Produit Alpha",
        periodeRefId: "cg-p3",
        planAnalytiqueId: "plan-2026",
        periodeCommencee: true,
        lignes: [
            { id: "fcs1-l1", composante: "MATIERES", libelle: "Matières premières — norme 4,5 kg/u", quantiteStandard: 4.5, coutUnitaireStandard: 1000000, coutStandardTotal: 4500000 },
            { id: "fcs1-l2", composante: "MOD", libelle: "Main d'œuvre directe — norme 2 h/u", quantiteStandard: 2, coutUnitaireStandard: 1000000, coutStandardTotal: 2000000 },
            { id: "fcs1-l3", composante: "CHARGES_INDIRECTES", centreId: "c1", centreLibelle: "Production", libelle: "Centre Production — 1,5 H.Mod/u", quantiteStandard: 1.5, coutUnitaireStandard: 1000000, coutStandardTotal: 1500000, activiteNormale: 1000 },
        ],
    },
    {
        id: "fcs2",
        produitCode: "PROD-B",
        produitLibelle: "Produit Beta",
        periodeRefId: "cg-p3",
        planAnalytiqueId: "plan-2026",
        periodeCommencee: true,
        lignes: [
            { id: "fcs2-l1", composante: "MATIERES", libelle: "Matières premières — norme 6 kg/u", quantiteStandard: 6, coutUnitaireStandard: 1000000, coutStandardTotal: 6000000 },
            { id: "fcs2-l2", composante: "MOD", libelle: "Main d'œuvre directe — norme 3 h/u", quantiteStandard: 3, coutUnitaireStandard: 1000000, coutStandardTotal: 3000000 },
            { id: "fcs2-l3", composante: "CHARGES_INDIRECTES", centreId: "c1", centreLibelle: "Production", libelle: "Centre Production — 2 H.Mod/u", quantiteStandard: 2, coutUnitaireStandard: 1000000, coutStandardTotal: 2000000, activiteNormale: 1000 },
        ],
    },
    {
        id: "fcs3",
        produitCode: "PROD-A",
        produitLibelle: "Produit Alpha",
        periodeRefId: "cg-p4",
        planAnalytiqueId: "plan-2026",
        periodeCommencee: false,
        lignes: [
            { id: "fcs3-l1", composante: "MATIERES", libelle: "Matières premières — norme 4,3 kg/u (révisée)", quantiteStandard: 4.3, coutUnitaireStandard: 1050000, coutStandardTotal: 4515000 },
            { id: "fcs3-l2", composante: "MOD", libelle: "Main d'œuvre directe — norme 1,8 h/u", quantiteStandard: 1.8, coutUnitaireStandard: 1000000, coutStandardTotal: 1800000 },
        ],
    },
];
