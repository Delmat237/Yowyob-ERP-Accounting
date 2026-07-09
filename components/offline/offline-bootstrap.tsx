"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ServiceWorkerRegister } from "@/components/offline/service-worker-register";
import { precacheAllShellRoutes, precacheAnalyseRoutes } from "@/lib/offline/precache-routes";
import { prefetchAllOfflineData } from "@/lib/offline/prefetch-all-data";
import { prefetchAnalyseReportsForCurrentPeriode } from "@/lib/offline/prefetch-analyse-reports";
import { warmCurrentRouteForOffline } from "@/lib/offline/route-cache-warmup";
import { getStoredToken, isTokenValid } from "@/lib/auth-session";

function isAuthenticatedForPrefetch(): boolean {
    const token = getStoredToken();
    return isTokenValid(token) || Boolean(token);
}

/**
 * Pré-cache shell + données API en arrière-plan (sans router.prefetch massif).
 * Le prefetch Next.js sur ~100 routes provoquait une tempête RSC et cassait la navigation.
 */
async function bootstrapOfflineNavigation(): Promise<void> {
    if (!navigator.onLine || !isAuthenticatedForPrefetch()) return;

    await Promise.allSettled([
        precacheAnalyseRoutes(),
        prefetchAllOfflineData(),
    ]);
    await prefetchAnalyseReportsForCurrentPeriode().catch((err) => {
        console.warn("[offline] prefetch analyse reports skipped:", err);
    });
    await precacheAllShellRoutes();
}

function scheduleDeferredBootstrap(run: () => Promise<void>): void {
    const start = () => {
        void run();
    };

    if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => window.setTimeout(start, 4000), { timeout: 60_000 });
        return;
    }

    window.setTimeout(start, 12_000);
}

/**
 * Enregistre le SW et prépare navigation + données offline (sans visite page par page).
 */
export function OfflineBootstrap() {
    const pathname = usePathname();
    const fullBootstrapDone = useRef(false);
    const precacheRunning = useRef(false);

    useEffect(() => {
        warmCurrentRouteForOffline();
    }, [pathname]);

    useEffect(() => {
        if (!navigator.onLine || !isAuthenticatedForPrefetch()) return;
        if (fullBootstrapDone.current) return;

        fullBootstrapDone.current = true;
        scheduleDeferredBootstrap(bootstrapOfflineNavigation);
    }, []);

    useEffect(() => {
        const onOnline = () => {
            if (precacheRunning.current) return;
            precacheRunning.current = true;
            void bootstrapOfflineNavigation().finally(() => {
                precacheRunning.current = false;
            });
        };
        window.addEventListener("online", onOnline);
        return () => window.removeEventListener("online", onOnline);
    }, []);

    useEffect(() => {
        const onControllerChange = () => warmCurrentRouteForOffline();
        navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
        return () => {
            navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
        };
    }, [pathname]);

    return <ServiceWorkerRegister />;
}
