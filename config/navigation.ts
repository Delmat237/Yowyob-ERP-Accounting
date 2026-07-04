import {
    Users,
    Truck,
    FileText,
    BarChart3,
    Settings,
    LayoutDashboard,
    BookOpen,
    PackagePlus,
    PackageSearch,
    FileClock,
    ShieldCheck,
    History,
    PenSquare,
    ArrowRightLeft,
    CreditCard,
    Receipt,
    Coins,
    Landmark,
    Globe,
    Building2,
    Notebook,
    Scale,
    ListChecks,
    Layers,
    ClipboardCheck,
    Rocket,
    GitBranch,
    Target,
    Calendar,
    TrendingDown,
    Wallet,
    SplitSquareHorizontal,
    Ruler,
    Calculator,
    Repeat2,
    Star,
    Library,
    PieChart,
    LineChart,
} from "lucide-react";

export type SidebarLink = {
    title: string;
    label?: string;
    icon: React.ElementType;
    href: string;
    allowedRoles?: string[];
};

export type Module = {
    name: string;
    icon: React.ElementType;
    composeActionLabel: string;
    sidebarLinks: SidebarLink[];
    allowedRoles?: string[];
};

export const moduleKeys = [
    "dashboard",
    "clients",
    "fournisseurs",
    "analyse",
    "generale",
    "analytique",
    "analyseAnalytique",
    "configurationAnalytique",
    "configuration",
] as const;
export type ModuleKey = typeof moduleKeys[number];

export const modules: Record<ModuleKey, Module> = {
    dashboard: {
        name: "Tableau de bord",
        icon: LayoutDashboard,
        composeActionLabel: "",
        sidebarLinks: [
            { title: "Tableau de Bord", icon: LayoutDashboard, href: "/accounting/dashboard" },
        ],
    },
    clients: {
        name: "Clients",
        icon: Users,
        composeActionLabel: "",
        sidebarLinks: [
            { title: "Factures Clients", icon: Receipt, href: "/invoices" },
            { title: "Avoirs", icon: PenSquare, href: "/sales/new-order" },
            { title: "Paiements", icon: CreditCard, href: "/sales/order-journal" },
            { title: "Produits", icon: PackageSearch, href: "/products" },
            { title: "Clients", icon: Users, href: "/customers" },
            { title: "Fournisseurs", icon: Truck, href: "/suppliers" },
        ],
    },
    fournisseurs: {
        name: "Fournisseurs",
        icon: Truck,
        composeActionLabel: "",
        sidebarLinks: [
            { title: "Factures Fournisseurs", icon: Receipt, href: "/invoices" },
            { title: "Remboursements", icon: Coins, href: "/stock/entries" },
            { title: "Paiements", icon: ArrowRightLeft, href: "/stock/transfer" },
            { title: "Produits", icon: PackagePlus, href: "/stock/transformation" },
            { title: "Fournisseurs", icon: Building2, href: "/suppliers" },
        ],
    },
    // Reporting CG uniquement (bilan, compte de résultat, grand livre, etc.).
    analyse: {
        name: "Analyse",
        icon: BarChart3,
        composeActionLabel: "",
        allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'],
        sidebarLinks: [
            { title: "Rapports Financiers", icon: FileText, href: "/accounting/reports", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Bilan", icon: Scale, href: "/analyse/balance-sheet", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Compte de Résultat", icon: BookOpen, href: "/analyse/profit-and-loss", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Flux de Trésorerie", icon: ArrowRightLeft, href: "/analyse/cache-flow", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Résumé Général", icon: Notebook, href: "/analyse/executive-summary", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Grand Livre", icon: BookOpen, href: "/analyse/generale-ledger", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Balance Générale", icon: Landmark, href: "/analyse/generale-balance", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Journal Audit", icon: History, href: "/analyse/audits", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE'] },
        ],
    },
    generale: {
        name: "Comptabilité Générale",
        icon: BookOpen,
        composeActionLabel: "",
        sidebarLinks: [
            { title: "Plan Comptable", icon: BookOpen, href: "/accounting/chart-of-accounts", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Écritures Comptables", icon: FileClock, href: "/accounting/entries", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Saisie semi-automatique", icon: ListChecks, href: "/accounting/semi-auto-entries", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Validation Écritures", icon: ShieldCheck, href: "/accounting/validation", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE'] },
            { title: "Paramètre général", icon: Settings, href: "/settings/accounting", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
        ],
    },
    analytique: {
        name: "Comptabilité Analytique",
        icon: PieChart,
        composeActionLabel: "",
        allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'],
        sidebarLinks: [
            { title: "Tableau de bord", icon: LayoutDashboard, href: "/analytique/dashboard", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Charges Analytiques", icon: FileText, href: "/analytique/charges", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Écritures analytiques", icon: FileClock, href: "/analytique/ecritures", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Validation des écritures analytiques", icon: ShieldCheck, href: "/analytique/ecritures/validation", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE'] },
            { title: "Ventilation Analytique", icon: SplitSquareHorizontal, href: "/analytique/ventilation", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Tableau de Répartition", icon: ArrowRightLeft, href: "/analytique/repartition", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Coûts Complets", icon: Target, href: "/analytique/couts-complets", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Coûts Partiels", icon: TrendingDown, href: "/analytique/couts-partiels", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Imputation Rationnelle", icon: Scale, href: "/analytique/imputation-rationnelle", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Coûts Préétablis", icon: ClipboardCheck, href: "/analytique/couts-pretablis", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Concordance générale et analytique", icon: BookOpen, href: "/analytique/concordance", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Axes Analytiques", icon: Layers, href: "/accounting/analytics", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
        ],
    },
    // Reporting CA (PDF §3 : balance par compte, résultat par axe, budget vs réalisé CU-B04).
    analyseAnalytique: {
        name: "Analyse",
        icon: LineChart,
        composeActionLabel: "",
        allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'],
        sidebarLinks: [
            { title: "Rapports Analytiques", icon: BarChart3, href: "/accounting/analytics/reports", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "États Analytiques", icon: FileText, href: "/analytique/etats", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Balance par Compte", icon: Landmark, href: "/accounting/analytics/ledger", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Budget vs Réalisé", icon: Wallet, href: "/analytique/budget", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE'] },
            { title: "Suivi Budgétaire", icon: TrendingDown, href: "/accounting/budgets", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE'] },
            { title: "Validation Budgets", icon: ClipboardCheck, href: "/accounting/budget-validation", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
        ],
    },
    configurationAnalytique: {
        name: "Configuration",
        icon: Settings,
        composeActionLabel: "",
        allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'],
        sidebarLinks: [
            { title: "Plan Analytique", icon: Library, href: "/analytique/plan", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Comptes Analytiques", icon: BookOpen, href: "/analytique/comptes-analytiques", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Centres d'Analyse", icon: GitBranch, href: "/analytique/centres", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Journaux analytiques", icon: Notebook, href: "/analytique/journaux", allowedRoles: ['RESPONSABLE_COMPTABLE', 'COMPTABLE'] },
            { title: "Périodes", icon: Calendar, href: "/analytique/periodes", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
            { title: "Unités d'Œuvre", icon: Ruler, href: "/analytique/unites-oeuvre", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Incorporations", icon: Layers, href: "/analytique/incorporations", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Valorisation Stocks", icon: PackageSearch, href: "/analytique/valorisation-stocks", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Méthode de Coût", icon: Calculator, href: "/analytique/methode-cout", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Prix de Cessions", icon: Repeat2, href: "/analytique/prix-cessions", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Coûts Standards", icon: Star, href: "/analytique/couts-standards", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Configuration Globale", icon: Settings, href: "/analytique/configuration", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
        ],
    },
    configuration: {
        name: "Configuration",
        icon: Settings,
        composeActionLabel: "",
        allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE'],
        sidebarLinks: [
            { title: "Initialisation comptable", icon: Rocket, href: "/accounting/setup", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
            { title: "Activités comptables", icon: Layers, href: "/accounting/subscription", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
            { title: "Plan Comptable", icon: BookOpen, href: "/accounting/chart-of-accounts", allowedRoles: ['RESPONSABLE_COMPTABLE', 'COMPTABLE'] },
            { title: "Comptes Comptables", icon: Landmark, href: "/accounting/accounts", allowedRoles: ['RESPONSABLE_COMPTABLE', 'COMPTABLE'] },
            { title: "Exercices Comptables", icon: FileClock, href: "/accounting/fiscal-years", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
            { title: "Périodes Comptables", icon: ListChecks, href: "/accounting/periods", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
            { title: "Journaux", icon: Notebook, href: "/accounting/journals", allowedRoles: ['RESPONSABLE_COMPTABLE', 'COMPTABLE'] },
            { title: "Opérations Comptables", icon: FileClock, href: "/accounting/operations", allowedRoles: ['RESPONSABLE_COMPTABLE', 'COMPTABLE'] },
            { title: "Taxes", icon: Coins, href: "/accounting/taxes", allowedRoles: ['RESPONSABLE_COMPTABLE', 'COMPTABLE'] },
            { title: "Devises", icon: Globe, href: "/accounting/devises", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
            { title: "Fiscalité OHADA", icon: BookOpen, href: "/accounting/ohada-pack", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
            { title: "Attribution des Rôles", icon: ShieldCheck, href: "/accounting/role-assignment", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
        ],
    },
};

/** Préfixes de routes réservés à la comptabilité analytique. */
const ANALYTIQUE_ROUTE_PREFIXES = [
    ...modules.analytique.sidebarLinks.map((link) => link.href),
    ...modules.analyseAnalytique.sidebarLinks.map((link) => link.href),
    ...modules.configurationAnalytique.sidebarLinks.map((link) => link.href),
    '/analytique',
];

export function isAnalytiqueRoute(pathname: string): boolean {
    return ANALYTIQUE_ROUTE_PREFIXES.some(
        (href) => pathname === href || pathname.startsWith(`${href}/`),
    );
}
