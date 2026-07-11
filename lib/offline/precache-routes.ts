import { ALL_SHELL_OFFLINE_ROUTES, ANALYSE_OFFLINE_ROUTES } from "@/lib/offline/offline-routes";
import {
    PAGES_CACHE,
    STATIC_CACHE,
    RSC_CACHE,
    isRouteOfflineReady,
} from "@/lib/offline/route-cache-warmup";

const PRECACHE_DELAY_MS = 400;
const PRECACHE_BATCH_SIZE = 2;
const MAX_ASSETS_PER_ROUTE = 80;

function extractAssetUrls(html: string): string[] {
    const urls = new Set<string>();
    const pattern = /(?:src|href)="(\/_next\/[^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
        try {
            urls.add(new URL(match[1], window.location.origin).href);
        } catch {
            /* ignore */
        }
    }
    return [...urls];
}

async function precacheRscRoute(pathname: string): Promise<void> {
    if (!("caches" in window) || !navigator.onLine) return;

    try {
        const response = await fetch(pathname, {
            credentials: "same-origin",
            headers: {
                RSC: "1",
                "Next-Router-Prefetch": "1",
                "Next-Url": pathname,
            },
        });
        if (!response.ok) return;

        const rscCache = await caches.open(RSC_CACHE);
        await rscCache.put(`rsc:${pathname}`, response.clone());
    } catch {
        /* ignore */
    }
}

async function precacheSingleRoute(pathname: string): Promise<void> {
    if (!("caches" in window) || !navigator.onLine) return;

    const href = new URL(pathname, window.location.origin).href;

    try {
        const response = await fetch(href, { credentials: "same-origin" });
        if (!response.ok) return;

        const html = await response.text();
        const htmlResponse = new Response(html, {
            status: response.status,
            statusText: response.statusText,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });

        const pagesCache = await caches.open(PAGES_CACHE);
        await pagesCache.put(pathname, htmlResponse.clone());
        await pagesCache.put(href, htmlResponse.clone());

        const staticCache = await caches.open(STATIC_CACHE);
        const assets = extractAssetUrls(html);
        await Promise.allSettled(
            assets.slice(0, MAX_ASSETS_PER_ROUTE).map(async (assetUrl) => {
                try {
                    const assetRes = await fetch(assetUrl, { credentials: "same-origin" });
                    if (assetRes.ok) await staticCache.put(assetUrl, assetRes);
                } catch {
                    /* ignore */
                }
            }),
        );

        navigator.serviceWorker?.controller?.postMessage({ type: "CACHE_URL", url: href });
        if (assets.length > 0) {
            navigator.serviceWorker?.controller?.postMessage({
                type: "CACHE_ASSETS",
                urls: assets.slice(0, MAX_ASSETS_PER_ROUTE),
            });
        }

        await precacheRscRoute(pathname);
    } catch {
        /* ignore */
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function filterUncachedRoutes(routes: readonly string[]): Promise<string[]> {
    const missing: string[] = [];
    for (const route of routes) {
        if (!(await isRouteOfflineReady(route))) missing.push(route);
    }
    return missing;
}

async function precacheRouteList(routes: readonly string[]): Promise<void> {
    for (let i = 0; i < routes.length; i += PRECACHE_BATCH_SIZE) {
        if (!navigator.onLine) break;
        const batch = routes.slice(i, i + PRECACHE_BATCH_SIZE);
        await Promise.allSettled(batch.map((route) => precacheSingleRoute(route)));
        await sleep(PRECACHE_DELAY_MS);
    }
}

/**
 * Pré-cache prioritaire des routes de l'onglet Analyse (shell + RSC).
 */
export async function precacheAnalyseRoutes(force = false): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine) return;

    const routes = force
        ? [...ANALYSE_OFFLINE_ROUTES]
        : await filterUncachedRoutes(ANALYSE_OFFLINE_ROUTES);

    if (routes.length === 0) return;
    await precacheRouteList(routes);
}

/**
 * Pré-cache toutes les routes shell (HTML + RSC + assets) pour navigation offline.
 * Reprend automatiquement les routes manquantes.
 */
export async function precacheAllShellRoutes(force = false): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine) return;

    const routes = force
        ? [...ALL_SHELL_OFFLINE_ROUTES]
        : await filterUncachedRoutes(ALL_SHELL_OFFLINE_ROUTES);

    if (routes.length === 0) return;
    await precacheRouteList(routes);
}

/** @deprecated Utiliser precacheAllShellRoutes */
export async function precacheAccountingRoutes(force = false): Promise<void> {
    await precacheAllShellRoutes(force);
}

/** @deprecated Utiliser precacheAllShellRoutes */
export async function precacheAnalytiqueRoutes(force = false): Promise<void> {
    await precacheAllShellRoutes(force);
}

export function resetPrecacheSessionFlag(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("offline.precache_all_done");
    sessionStorage.removeItem("offline.precache_cg_done");
    sessionStorage.removeItem("offline.precache_ca_done");
}
