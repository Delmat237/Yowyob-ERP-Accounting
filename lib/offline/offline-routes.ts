import { modules, type ModuleKey } from "@/config/navigation";
import {
    ANALYTIQUE_DASHBOARD_PATH,
    GENERALE_DASHBOARD_PATH,
} from "@/lib/accounting-dashboard-routes";

/** Landing + pages publiques. */
export const PUBLIC_OFFLINE_ROUTES = ["/", "/offline"] as const;

/** Paramètres application. */
export const SETTINGS_OFFLINE_ROUTES = [
    "/settings",
    "/settings/accounting",
    "/settings/agencies",
    "/settings/audits",
    "/settings/business-actor",
    "/settings/company",
    "/settings/password",
    "/settings/profile",
    "/settings/roles",
    "/settings/users",
] as const;

const CG_MODULE_KEYS = [
    "dashboard",
    "generale",
    "configuration",
    "analyse",
    "clients",
    "fournisseurs",
] as const satisfies readonly ModuleKey[];

const CA_MODULE_KEYS = [
    "analytique",
    "analyseAnalytique",
    "configurationAnalytique",
] as const satisfies readonly ModuleKey[];

/** Routes CG supplémentaires (hors sidebar modules). */
const CG_EXTRA_ROUTES = [
    "/accounting/profile",
    "/accounting/modes-paiement",
    "/notifications",
] as const;

/** Routes CA supplémentaires. */
const CA_EXTRA_ROUTES = ["/analytique", "/analytique/profile"] as const;

function collectModuleHrefs(moduleKeys: readonly ModuleKey[]): string[] {
    const hrefs = new Set<string>();
    for (const key of moduleKeys) {
        for (const link of modules[key].sidebarLinks) {
            hrefs.add(link.href);
        }
    }
    return [...hrefs];
}

function dedupeSorted(routes: string[]): string[] {
    return [...new Set(routes)].sort((a, b) => a.localeCompare(b));
}

/** Routes CG — dérivées de la navigation sidebar. */
export const CG_OFFLINE_ROUTES = dedupeSorted([
    GENERALE_DASHBOARD_PATH,
    ...collectModuleHrefs(CG_MODULE_KEYS),
    ...CG_EXTRA_ROUTES,
]) as readonly string[];

/** Routes CA — dérivées de la navigation sidebar. */
export const CA_OFFLINE_ROUTES = dedupeSorted([
    ANALYTIQUE_DASHBOARD_PATH,
    ...collectModuleHrefs(CA_MODULE_KEYS),
    ...CA_EXTRA_ROUTES,
]) as readonly string[];

/** Reporting / analyse CG (inclus dans module analyse). */
export const ANALYSE_OFFLINE_ROUTES = collectModuleHrefs(["analyse"]) as readonly string[];

/** Modules transverses. */
export const SHARED_OFFLINE_ROUTES = ["/customers", "/suppliers", "/products"] as const;

/** Toutes les routes shell offline (CG + CA + settings + landing). */
export const ALL_SHELL_OFFLINE_ROUTES = dedupeSorted([
    ...PUBLIC_OFFLINE_ROUTES,
    ...SETTINGS_OFFLINE_ROUTES,
    ...CG_OFFLINE_ROUTES,
    ...CA_OFFLINE_ROUTES,
]) as readonly string[];

export type PublicOfflineRoute = (typeof PUBLIC_OFFLINE_ROUTES)[number];
export type SettingsOfflineRoute = (typeof SETTINGS_OFFLINE_ROUTES)[number];
export type CgOfflineRoute = (typeof CG_OFFLINE_ROUTES)[number];
export type CaOfflineRoute = (typeof CA_OFFLINE_ROUTES)[number];
export type SharedOfflineRoute = (typeof SHARED_OFFLINE_ROUTES)[number];

export function getOfflineFallbackDashboard(pathname: string): string {
    if (pathname.startsWith("/settings")) {
        return "/settings/profile";
    }
    if (pathname.startsWith("/analytique") || pathname.startsWith("/accounting/analytics")) {
        return ANALYTIQUE_DASHBOARD_PATH;
    }
    if (pathname.startsWith("/analyse")) {
        return "/accounting/reports";
    }
    if (pathname === "/") {
        return "/";
    }
    return GENERALE_DASHBOARD_PATH;
}
