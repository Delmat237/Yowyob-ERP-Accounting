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
    PieChart
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
    "configuration"
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
    analyse: {
        name: "Analyse",
        icon: BarChart3,
        composeActionLabel: "",
        sidebarLinks: [
            { title: "Rapports Financiers", icon: FileText, href: "/accounting/reports" },
            { title: "Bilan", icon: Scale, href: "/analyse/balance-sheet" },
            { title: "Compte de Résultat", icon: BookOpen, href: "/analyse/profit-and-loss" },
            { title: "Flux de Trésorerie", icon: ArrowRightLeft, href: "/analyse/cache-flow" },
            { title: "Résumé Général", icon: Notebook, href: "/analyse/executive-summary" },
            { title: "Grand Livre", icon: BookOpen, href: "/analyse/generale-ledger" },
            { title: "Balance Générale", icon: Landmark, href: "/analyse/generale-balance" },
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
            { title: "Axes Analytiques", icon: Layers, href: "/accounting/analytics", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Grand Livre Analytique", icon: BookOpen, href: "/accounting/analytics/ledger", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Rapports Analytiques", icon: BarChart3, href: "/accounting/analytics/reports", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE', 'AIDE_COMPTABLE'] },
            { title: "Budgets", icon: BarChart3, href: "/accounting/budgets", allowedRoles: ['COMPTABLE', 'RESPONSABLE_COMPTABLE'] },
            { title: "Validation Budgets", icon: ClipboardCheck, href: "/accounting/budget-validation", allowedRoles: ['RESPONSABLE_COMPTABLE'] },
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
