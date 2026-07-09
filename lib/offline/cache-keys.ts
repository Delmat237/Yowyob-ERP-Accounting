/** Clés de cache lecture offline — comptabilité générale (Phase 2). */
export const CG_CACHE_KEYS = {
    ECRITURES: "cg.ecritures",
    ECRITURES_NON_VALIDATED: "cg.ecritures_non_validees",
    JOURNAUX: "cg.journaux",
    PLAN_COMPTABLE: "cg.plan_comptable",
    BUDGETS: "cg.budgets",
    AXES_ACTIFS: "cg.axes_actifs",
    PERIODES: "cg.periodes",
    EXERCICES: "cg.exercices",
    COMPTES: "cg.comptes",
    OPERATIONS: "cg.operations",
    TAXES: "cg.taxes",
    DEVISES: "cg.devises",
    DEVISES_RATES: "cg.devises_rates",
} as const;

/** Clés de cache lecture offline — paramètres application. */
export const SETTINGS_CACHE_KEYS = {
    ROLES: "settings.roles",
    PROFILE_USER: "settings.profile.user",
    PROFILE_ACTOR: "settings.profile.actor",
    BUSINESS_ACTOR: "settings.business_actor",
    AUDITS: "settings.audits",
    ACCOUNTING: "settings.accounting",
    NOTIFICATIONS: "settings.notifications",
    organization: (orgId: string) => `settings.organization.${orgId}`,
    employees: (orgId: string) => `settings.employees.${orgId}`,
    agencies: (orgId: string) => `settings.agencies.${orgId}`,
} as const;

/** Clés de cache lecture offline — comptabilité analytique. */
export const CA_CACHE_KEYS = {
    AXES: "ca.axes",
    DASHBOARD: "ca.dashboard",
    CENTRES: "ca.centres",
    CHARGES: "ca.charges",
    COMPTES: "ca.comptes",
    PLAN_COMPTES: "ca.plan_comptes",
    JOURNAUX: "ca.journaux",
    CONFIG: "ca.config",
    BUDGETS: "ca.budgets",
} as const;

/** Clés de cache lecture offline — onglet Analyse (rapports CG par période). */
export const ANALYSE_CACHE_KEYS = {
    bilan: (periodeId: string) => `analyse.bilan.${periodeId}`,
    compteResultat: (periodeId: string) => `analyse.compte_resultat.${periodeId}`,
    cashFlow: (periodeId: string) => `analyse.cash_flow.${periodeId}`,
    executiveSummary: (periodeId: string) => `analyse.executive_summary.${periodeId}`,
    grandLivre: (periodeId: string) => `analyse.grand_livre.${periodeId}`,
    balance: (periodeId: string) => `analyse.balance.${periodeId}`,
    audits: (periodeId: string) => `analyse.audits.${periodeId}`,
} as const;

export type CgCacheKey = (typeof CG_CACHE_KEYS)[keyof typeof CG_CACHE_KEYS];
export type CaCacheKey = (typeof CA_CACHE_KEYS)[keyof typeof CA_CACHE_KEYS];
