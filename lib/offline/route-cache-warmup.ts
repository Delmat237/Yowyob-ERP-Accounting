/** Doit rester aligné avec public/sw.js (CACHE_VERSION). */
export const OFFLINE_CACHE_VERSION = "yowyob-erp-v18";
export const PAGES_CACHE = `${OFFLINE_CACHE_VERSION}-pages`;
export const STATIC_CACHE = `${OFFLINE_CACHE_VERSION}-static`;
export const RSC_CACHE = `${OFFLINE_CACHE_VERSION}-rsc`;

const LAST_ROUTE_KEY = "offline.last_route";

export function getLastOfflineRoute(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_ROUTE_KEY);
}

function collectDomAssetUrls(): string[] {
    const urls = new Set<string>();

    document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach((el) => {
        const raw = el.getAttribute("src") ?? el.getAttribute("href");
        if (!raw) return;
        try {
            urls.add(new URL(raw, window.location.origin).href);
        } catch {
            /* ignore */
        }
    });

    return [...urls];
}

async function putInCache(cacheName: string, url: string): Promise<void> {
    if (!("caches" in window)) return;
    try {
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) return;
        const cache = await caches.open(cacheName);
        await cache.put(url, response);
    } catch {
        /* ignore */
    }
}

async function warmRscRoute(pathname: string): Promise<void> {
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

async function warmRouteOnce(): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine) return;

    const href = window.location.href.split("#")[0];
    const pathname = window.location.pathname;

    if (pathname === "/offline") return;

    localStorage.setItem(LAST_ROUTE_KEY, pathname);

    const htmlCached = await isRouteCached(pathname);
    const pageWarmTasks = htmlCached
        ? []
        : [putInCache(PAGES_CACHE, href), putInCache(PAGES_CACHE, pathname)];

    await Promise.all([...pageWarmTasks, warmRscRoute(pathname)]);

    const staticCache = await caches.open(STATIC_CACHE);
    const assets = collectDomAssetUrls();
    await Promise.allSettled(
        assets.slice(0, 40).map(async (url) => {
            try {
                const response = await fetch(url, { credentials: "same-origin" });
                if (response.ok) await staticCache.put(url, response);
            } catch {
                /* ignore */
            }
        }),
    );

    const controller = navigator.serviceWorker?.controller;
    if (controller) {
        controller.postMessage({ type: "CACHE_URL", url: href });
        controller.postMessage({ type: "CACHE_ASSETS", urls: assets });
    }
}

let warmDebounceId: ReturnType<typeof setTimeout> | null = null;
let warmFollowUpId: ReturnType<typeof setTimeout> | null = null;

/**
 * Met en cache la page courante et ses assets Next.js pour un rechargement offline.
 * Débouncé pour éviter des milliers de requêtes réseau.
 */
export function warmCurrentRouteForOffline(): void {
    if (warmDebounceId) window.clearTimeout(warmDebounceId);
    if (warmFollowUpId) window.clearTimeout(warmFollowUpId);

    warmDebounceId = window.setTimeout(() => {
        void warmRouteOnce();
        warmFollowUpId = window.setTimeout(() => void warmRouteOnce(), 5000);
    }, 1500);
}

/** Vérifie si le HTML d'une route est disponible dans le cache navigateur. */
export async function isRouteCached(pathname: string): Promise<boolean> {
    if (!("caches" in window)) return false;
    const cache = await caches.open(PAGES_CACHE);
    const hit =
        (await cache.match(pathname)) ||
        (await cache.match(new URL(pathname, window.location.origin).href));
    return Boolean(hit);
}

/** Vérifie si une route est prête pour la navigation offline (HTML + payload RSC). */
export async function isRouteOfflineReady(pathname: string): Promise<boolean> {
    if (!(await isRouteCached(pathname))) return false;
    if (!("caches" in window)) return false;

    const rscCache = await caches.open(RSC_CACHE);
    const rscHit = await rscCache.match(`rsc:${pathname}`);
    return Boolean(rscHit);
}
