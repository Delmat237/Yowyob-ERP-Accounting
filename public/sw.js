/* eslint-disable no-restricted-globals */
/**
 * Service Worker — cache pages, RSC (navigation SPA) et assets /_next/ (prod).
 */

const CACHE_VERSION = "yowyob-erp-v18";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const RSC_CACHE = `${CACHE_VERSION}-rsc`;

/** Délai max avant fallback cache (fetch offline/DevTools reste pending 30–60s+ sans ça). */
const NETWORK_TIMEOUT_MS = 4000;

const MINIMAL_INSTALL_ROUTES = ["/", "/offline"];

const ACCOUNTING_OFFLINE_FALLBACKS = [
    "/accounting/dashboard",
    "/accounting/chart-of-accounts",
    "/accounting/journals",
    "/accounting/entries",
    "/accounting/reports",
];

function isApiRequest(url) {
    return (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/accounting-api")
    );
}

function isSameOrigin(url) {
    return url.origin === self.location.origin;
}

function isNextAsset(pathname) {
    return pathname.startsWith("/_next/");
}

function isRscRequest(request) {
    return request.headers.get("RSC") === "1";
}

function offlineShellResponse() {
    return new Response(
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hors ligne</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;text-align:center"><h1>Hors ligne</h1><p>Cette page n\'est pas encore en cache.</p><p><a href="/offline">Ouvrir l\'application hors ligne</a></p></body></html>',
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
}

self.addEventListener("install", (event) => {
    if (!self.navigator.onLine) {
        self.skipWaiting();
        return;
    }
    event.waitUntil(
        caches.open(PAGES_CACHE).then((cache) =>
            Promise.allSettled(
                MINIMAL_INSTALL_ROUTES.map(async (pathname) => {
                    try {
                        const response = await fetch(pathname, { credentials: "include" });
                        if (!response.ok) return;
                        await cache.put(pathname, response.clone());
                        await cache.put(new URL(pathname, self.location.origin).href, response.clone());
                    } catch {
                        /* ignore */
                    }
                }),
            ),
        ),
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => !key.startsWith(CACHE_VERSION))
                    .map((key) => caches.delete(key)),
            ),
        ),
    );
    self.clients.claim();
});

self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "CACHE_URL" && data.url) {
        event.waitUntil(cacheDocument(data.url));
    }

    if (data.type === "CACHE_ASSETS" && Array.isArray(data.urls)) {
        event.waitUntil(cacheAssets(data.urls));
    }

    if (data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (!isSameOrigin(url) || isApiRequest(url)) return;

    // Toujours intercepter les navigations (network-first + cache).
    // Ne pas se fier à navigator.onLine : DevTools « Offline » laisse souvent
    // navigator.onLine === true dans le SW → pas d'interception → page dinosaure Chrome.
    if (request.mode === "navigate") {
        event.respondWith(handleNavigate(request));
        return;
    }

    if (isRscRequest(request)) {
        // Network-first aussi pour RSC (même raison que navigate).
        event.respondWith(handleRsc(request));
        return;
    }

    if (isNextAsset(url.pathname)) {
        event.respondWith(handleStatic(request));
        return;
    }
});

async function cacheDocument(urlString) {
    const url = new URL(urlString, self.location.origin);
    if (!isSameOrigin(url)) return;

    try {
        const response = await fetch(urlString, { credentials: "include" });
        if (!response.ok) return;

        const cache = await caches.open(PAGES_CACHE);
        await cache.put(urlString, response.clone());
        await cache.put(url.pathname, response.clone());
    } catch {
        /* ignore */
    }
}

async function cacheAssets(urls) {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(
        urls.map(async (raw) => {
            try {
                const url = new URL(raw, self.location.origin);
                if (!isSameOrigin(url)) return;
                const response = await fetch(url.href);
                if (response.ok) await cache.put(url.href, response);
            } catch {
                /* ignore */
            }
        }),
    );
}

function storeInBackground(cacheName, request, response) {
    caches.open(cacheName).then((cache) => cache.put(request, response.clone())).catch(() => {});
}

async function fetchWithTimeout(request, init = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    try {
        return await fetch(request, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function matchPagesCache(pagesCache, paths) {
    for (const path of paths) {
        const hit = (await pagesCache.match(path)) || (await pagesCache.match(new URL(path, self.location.origin).href));
        if (hit) return hit;
    }
    return null;
}

async function handleStaticOffline(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Hors ligne", { status: 503, statusText: "Offline" });
}

async function handleStatic(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            storeInBackground(STATIC_CACHE, request, response);
        }
        return response;
    } catch {
        return handleStaticOffline(request);
    }
}

async function handleRscOffline(request) {
    const pathname = new URL(request.url).pathname;
    const rscCache = await caches.open(RSC_CACHE);
    const hit =
        (await rscCache.match(`rsc:${pathname}`)) ||
        (await rscCache.match(request)) ||
        (await caches.match(request));
    if (hit) return hit;
    return new Response("Hors ligne", { status: 503, statusText: "Offline" });
}

async function handleRsc(request) {
    if (!self.navigator.onLine) {
        return handleRscOffline(request);
    }

    try {
        const response = await fetchWithTimeout(request);
        if (response.ok) {
            const pathname = new URL(request.url).pathname;
            storeInBackground(RSC_CACHE, `rsc:${pathname}`, response);
            storeInBackground(RSC_CACHE, request, response);
        }
        return response;
    } catch {
        return handleRscOffline(request);
    }
}

async function cacheOnlineRsc(request) {
    return handleRsc(request);
}

async function cacheOnlineAsset(request) {
    return handleStatic(request);
}

async function offlineFallback(pagesCache, request, url) {
    const exact =
        (await pagesCache.match(request)) || (await pagesCache.match(url.pathname));
    if (exact) return exact;

    const keys = await pagesCache.keys();
    for (const cachedReq of keys) {
        const cachedUrl = new URL(cachedReq.url);
        if (cachedUrl.pathname === url.pathname) {
            const hit = await pagesCache.match(cachedReq);
            if (hit) return hit;
        }
    }

    if (url.pathname === "/") {
        return (await pagesCache.match("/")) || (await pagesCache.match("/offline"));
    }

    const isSettings = url.pathname.startsWith("/settings");
    const isAnalyse = url.pathname.startsWith("/analyse");
    const isAnalytique =
        url.pathname.startsWith("/analytique") ||
        url.pathname.startsWith("/accounting/analytics");
    const defaultDash = isSettings
        ? "/settings/profile"
        : isAnalytique
          ? "/analytique/dashboard"
          : isAnalyse
            ? "/accounting/reports"
            : "/accounting/dashboard";

    const sectionHit = await matchPagesCache(pagesCache, [defaultDash]);
    if (sectionHit) return sectionHit;

    if (url.pathname.startsWith("/accounting/")) {
        const accountingHit = await matchPagesCache(pagesCache, ACCOUNTING_OFFLINE_FALLBACKS);
        if (accountingHit) return accountingHit;
    }

    return (
        (await pagesCache.match("/offline")) ||
        offlineShellResponse()
    );
}

async function handleNavigate(request) {
    const url = new URL(request.url);
    const pagesCache = await caches.open(PAGES_CACHE);

    // navigator.onLine === false : évite un fetch inutile (complément au timeout).
    if (!self.navigator.onLine) {
        return offlineFallback(pagesCache, request, url);
    }

    // Network-first : timeout court pour ne pas bloquer la navigation Next.js (RSC en attente).
    try {
        const response = await fetchWithTimeout(new Request(request, { credentials: "include" }));
        if (response.ok) {
            storeInBackground(PAGES_CACHE, request, response);
            storeInBackground(PAGES_CACHE, new Request(url.pathname, request), response);
        }
        return response;
    } catch {
        return offlineFallback(pagesCache, request, url);
    }
}
