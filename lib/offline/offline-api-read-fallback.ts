import { CG_CACHE_KEYS, CA_CACHE_KEYS, SETTINGS_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { getCachedList, setCachedList } from "@/lib/offline/list-cache";
import { mergeListCacheWithOutbox } from "@/lib/offline/merge-list-cache";
import { networkStatus } from "@/lib/offline/network-status";

type ApiEnvelope<T> = {
    success: true;
    data: T;
    message?: string;
    fromOfflineCache?: boolean;
};

type ListItem = { id?: string; actif?: boolean; cloturee?: boolean; cloture?: boolean };

type ResolvedList = {
    cacheKey: string;
    transform?: (data: unknown) => unknown;
};

function apiPathname(url: string): string {
    try {
        const parsed = url.startsWith("http") ? new URL(url) : new URL(url, "http://local");
        return parsed.pathname.replace(/\/+$/, "") || "/";
    } catch {
        return url.split("?")[0].replace(/\/+$/, "") || "/";
    }
}

function asArray(data: unknown): ListItem[] {
    return Array.isArray(data) ? (data as ListItem[]) : [];
}

function filterActive<T extends { actif?: boolean }>(data: unknown): T[] {
    return asArray(data).filter((item) => item.actif !== false) as T[];
}

function filterComptesByType(data: unknown, type: string): ListItem[] {
    const normalized = type.toUpperCase();
    return asArray(data).filter((compte) => {
        const typeCompte = (compte as { typeCompte?: string }).typeCompte?.toUpperCase() ?? "";
        if (typeCompte && (typeCompte === normalized || typeCompte.includes(normalized))) {
            return true;
        }
        const no = (compte as { noCompte?: string }).noCompte ?? "";
        if (normalized.includes("CLIENT")) return no.startsWith("41");
        if (normalized.includes("FOURNISSEUR") || normalized.includes("SUPPLIER")) {
            return no.startsWith("40");
        }
        if (normalized.includes("CASH") || normalized.includes("CAISSE")) {
            return no.startsWith("57");
        }
        if (normalized.includes("BANK") || normalized.includes("BANQUE")) {
            return no.startsWith("52");
        }
        return typeCompte === normalized;
    });
}

/** Sous-routes filtrées : lecture offline oui, écriture cache non. */
function isFilteredListPath(path: string): boolean {
    if (path === "/api/accounting/journals/active") return true;
    if (path === "/api/accounting/comptes/clients") return true;
    if (path === "/api/accounting/comptes/suppliers") return true;
    if (path === "/api/accounting/comptes/cash") return true;
    if (path === "/api/accounting/comptes/banks") return true;
    if (path === "/api/accounting/plan-comptable/actifs") return true;
    if (path === "/api/accounting/periodes/non-closed") return true;
    if (path === "/api/accounting/exercices/active") return true;
    if (/^\/api\/accounting\/comptes\/type\//.test(path)) return true;
    return false;
}

function resolveListCache(path: string): ResolvedList | null {
    if (path === "/api/accounting/journals/active") {
        return {
            cacheKey: CG_CACHE_KEYS.JOURNAUX,
            transform: (data) => filterActive(data),
        };
    }
    if (path === "/api/accounting/journals") {
        return { cacheKey: CG_CACHE_KEYS.JOURNAUX };
    }

    if (path === "/api/accounting/comptes/clients") {
        return {
            cacheKey: CG_CACHE_KEYS.COMPTES,
            transform: (data) => filterComptesByType(data, "CLIENT"),
        };
    }
    if (path === "/api/accounting/comptes/suppliers") {
        return {
            cacheKey: CG_CACHE_KEYS.COMPTES,
            transform: (data) => filterComptesByType(data, "FOURNISSEUR"),
        };
    }
    if (path === "/api/accounting/comptes/cash") {
        return {
            cacheKey: CG_CACHE_KEYS.COMPTES,
            transform: (data) => filterComptesByType(data, "CASH"),
        };
    }
    if (path === "/api/accounting/comptes/banks") {
        return {
            cacheKey: CG_CACHE_KEYS.COMPTES,
            transform: (data) => filterComptesByType(data, "BANK"),
        };
    }
    if (path === "/api/accounting/comptes") {
        return { cacheKey: CG_CACHE_KEYS.COMPTES };
    }

    const compteTypeMatch = path.match(/^\/api\/accounting\/comptes\/type\/([^/]+)$/);
    if (compteTypeMatch) {
        const type = decodeURIComponent(compteTypeMatch[1]);
        return {
            cacheKey: CG_CACHE_KEYS.COMPTES,
            transform: (data) => filterComptesByType(data, type),
        };
    }

    if (path === "/api/accounting/plan-comptable/actifs") {
        return {
            cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
            transform: (data) => filterActive(data),
        };
    }
    if (path === "/api/accounting/plan-comptable") {
        return { cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE };
    }

    if (path === "/api/accounting/periodes/non-closed") {
        return {
            cacheKey: CG_CACHE_KEYS.PERIODES,
            transform: (data) =>
                asArray(data).filter(
                    (p) => !(p as { cloturee?: boolean }).cloturee,
                ),
        };
    }
    if (path === "/api/accounting/periodes") {
        return { cacheKey: CG_CACHE_KEYS.PERIODES };
    }

    if (path === "/api/accounting/exercices/active") {
        return {
            cacheKey: CG_CACHE_KEYS.EXERCICES,
            transform: (data) => filterActive(data),
        };
    }
    if (path === "/api/accounting/exercices") {
        return { cacheKey: CG_CACHE_KEYS.EXERCICES };
    }

    if (path === "/api/accounting/operations") {
        return { cacheKey: CG_CACHE_KEYS.OPERATIONS };
    }
    if (path === "/api/accounting/taxes") {
        return { cacheKey: CG_CACHE_KEYS.TAXES };
    }
    if (path === "/api/accounting/currencies") {
        return { cacheKey: CG_CACHE_KEYS.DEVISES };
    }
    if (path === "/api/accounting/budgets") {
        return { cacheKey: CG_CACHE_KEYS.BUDGETS };
    }

    if (path === "/api/accounting/analytics/active") {
        return { cacheKey: CG_CACHE_KEYS.AXES_ACTIFS };
    }
    if (path === "/api/accounting/analytics") {
        return { cacheKey: CA_CACHE_KEYS.AXES };
    }

    if (path === "/api/accounting/settings") {
        return { cacheKey: SETTINGS_CACHE_KEYS.ACCOUNTING };
    }

    return null;
}

/**
 * Retourne une réponse API enveloppée depuis le cache IndexedDB pour les GET de listes
 * utilisées dans les formulaires (journaux, comptes, périodes, etc.).
 */
export async function tryOfflineApiReadFallback(
    url: string,
    method: string,
): Promise<ApiEnvelope<unknown> | null> {
    if (typeof window === "undefined") return null;
    if (method.toUpperCase() !== "GET") return null;

    const resolved = resolveListCache(apiPathname(url));
    if (!resolved) return null;

    const cached = await getCachedList<unknown>(resolved.cacheKey);
    if (!cached) return null;

    let data = cached.data;
    if (Array.isArray(data)) {
        data = await mergeListCacheWithOutbox(
            resolved.cacheKey,
            data as { id?: string }[],
        );
    }

    if (resolved.transform) {
        data = resolved.transform(data);
    }

    return {
        success: true,
        data,
        message: "Données hors ligne (cache local)",
        fromOfflineCache: true,
    };
}

/** Indique si on doit court-circuiter l'API et lire le cache local. */
export function shouldPreferOfflineReadFallback(): boolean {
    if (typeof window === "undefined") return false;
    return !networkStatus.isOnline() || networkStatus.getMode() === "offline";
}

/**
 * Alimente le cache local après un GET réussi (formulaires visités en ligne).
 * Les variantes filtrées (/active, /clients…) réutilisent la clé de la liste complète.
 */
export async function cacheApiListResponseIfApplicable(
    url: string,
    method: string,
    responseBody: unknown,
): Promise<void> {
    if (typeof window === "undefined") return;
    if (method.toUpperCase() !== "GET") return;
    if (!responseBody || typeof responseBody !== "object") return;

    const envelope = responseBody as { success?: boolean; data?: unknown };
    if (envelope.success === false || envelope.data == null) return;

    const path = apiPathname(url);
    if (isFilteredListPath(path)) return;

    const resolved = resolveListCache(path);
    if (!resolved) return;

    try {
        await setCachedList(resolved.cacheKey, envelope.data);
    } catch (error) {
        console.warn("[offline] Échec mise en cache lecture API", error);
    }
}
