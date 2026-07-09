import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ALL_SHELL_OFFLINE_ROUTES } from "@/lib/offline/offline-routes";

const PREFETCH_DELAY_MS = 35;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Précharge le cache client Next.js (RSC) pour toutes les routes shell.
 * Permet la navigation sidebar hors ligne sans Ctrl+R.
 */
export async function prefetchAllRoutesForOffline(router: AppRouterInstance): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine) return;

    for (const route of ALL_SHELL_OFFLINE_ROUTES) {
        if (!navigator.onLine) break;
        try {
            router.prefetch(route);
        } catch {
            /* ignore */
        }
        await sleep(PREFETCH_DELAY_MS);
    }
}
