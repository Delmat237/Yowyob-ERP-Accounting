import {
    LayoutDashboard,
    Settings,
    BarChart3,
    BookOpen,
    Layers,
    FileText,
    GitBranch,
    Target,
    Scale,
    Calendar,
    TrendingDown,
    PieChart,
    ArrowRightLeft,
    ClipboardCheck,
    Wallet,
    SplitSquareHorizontal,
    Ruler,
    PackageSearch,
    Calculator,
    Repeat2,
    Star,
    Library,
} from "lucide-react";

export type SidebarLink = {
    title: string;
    icon: React.ElementType;
    href: string;
    allowedRoles?: string[];
};

export type Module = {
    name: string;
    icon: React.ElementType;
    sidebarLinks: SidebarLink[];
    allowedRoles?: string[];
};

export const moduleKeys = [
    "dashboard",
    "parametrage",
    "saisie",
    "couts",
    "reporting",
] as const;

export type ModuleKey = (typeof moduleKeys)[number];

export const modules: Record<ModuleKey, Module> = {
    dashboard: {
        name: "Tableau de bord",
        icon: LayoutDashboard,
        sidebarLinks: [
            { title: "Vue d'ensemble", icon: LayoutDashboard, href: "/analytique/dashboard" },
        ],
    },
    parametrage: {
        name: "Paramétrage",
        icon: Settings,
        sidebarLinks: [
            { title: "Plan Analytique", icon: Library, href: "/analytique/plan" },
            { title: "Comptes Analytiques", icon: BookOpen, href: "/analytique/comptes-analytiques" },
            { title: "Centres d'Analyse", icon: GitBranch, href: "/analytique/centres" },
            { title: "Périodes", icon: Calendar, href: "/analytique/periodes", allowedRoles: ["RESPONSABLE_COMPTABLE"] },
            { title: "Unités d'Œuvre", icon: Ruler, href: "/analytique/unites-oeuvre" },
            { title: "Incorporations", icon: Layers, href: "/analytique/incorporations" },
            { title: "Valorisation Stocks", icon: PackageSearch, href: "/analytique/valorisation-stocks" },
            { title: "Méthode de Coût", icon: Calculator, href: "/analytique/methode-cout" },
            { title: "Prix de Cessions", icon: Repeat2, href: "/analytique/prix-cessions" },
            { title: "Coûts Standards", icon: Star, href: "/analytique/couts-standards" },
            { title: "Configuration Globale", icon: Settings, href: "/analytique/configuration", allowedRoles: ["RESPONSABLE_COMPTABLE"] },
        ],
    },
    saisie: {
        name: "Saisie",
        icon: BookOpen,
        sidebarLinks: [
            { title: "Charges Analytiques", icon: FileText, href: "/analytique/charges" },
            { title: "Ventilation Analytique", icon: SplitSquareHorizontal, href: "/analytique/ventilation" },
            { title: "Tableau de Répartition", icon: ArrowRightLeft, href: "/analytique/repartition" },
        ],
    },
    couts: {
        name: "Calcul des Coûts",
        icon: BarChart3,
        sidebarLinks: [
            { title: "Budget Analytique", icon: Wallet, href: "/analytique/budget" },
            { title: "Coûts Complets", icon: Target, href: "/analytique/couts-complets" },
            { title: "Coûts Partiels", icon: TrendingDown, href: "/analytique/couts-partiels" },
            { title: "Imputation Rationnelle", icon: Scale, href: "/analytique/imputation-rationnelle" },
            { title: "Coûts Préétablis", icon: ClipboardCheck, href: "/analytique/couts-pretablis" },
            { title: "Concordance CG/CA", icon: BookOpen, href: "/analytique/concordance" },
        ],
    },
    reporting: {
        name: "Reporting",
        icon: PieChart,
        sidebarLinks: [
            { title: "États Analytiques", icon: FileText, href: "/analytique/etats" },
        ],
    },
};
