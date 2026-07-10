import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { setCachedList, getCachedList } from "@/lib/offline/list-cache";
import { syncRequest } from "@/lib/offline/sync-request";
import { idbGet, idbPut } from "@/lib/offline/idb";
import type { MetaEntry } from "@/lib/offline/types";

const LAST_PULL_KEY = "sync.lastPullAt";

type SyncPullResponse = {
    success?: boolean;
    data?: {
        serverTime?: string;
        since?: string;
        changes?: Record<string, unknown[]>;
    };
};

const ENTITY_TO_CACHE: Record<string, string> = {
    "cg.journaux": CG_CACHE_KEYS.JOURNAUX,
    "cg.taxes": CG_CACHE_KEYS.TAXES,
    "cg.devises": CG_CACHE_KEYS.DEVISES,
    "cg.operations": CG_CACHE_KEYS.OPERATIONS,
    "cg.plan_comptable": CG_CACHE_KEYS.PLAN_COMPTABLE,
    "cg.periodes": CG_CACHE_KEYS.PERIODES,
    ecriture_comptable: CG_CACHE_KEYS.ECRITURES,
};

/** Horodatage du dernier pull réussi (ISO). */
export async function getLastPullAt(): Promise<string | undefined> {
    const entry = await idbGet<MetaEntry>("meta", LAST_PULL_KEY);
    return typeof entry?.value === "string" ? entry.value : undefined;
}

async function setLastPullAt(iso: string): Promise<void> {
    await idbPut("meta", { key: LAST_PULL_KEY, value: iso } satisfies MetaEntry);
}

/**
 * Pull incrémental depuis le backend (`GET /api/accounting/sync/pull?since=`).
 * Fusionne les listes changées dans IndexedDB.
 */
export async function pullSyncChanges(): Promise<{ updatedKeys: string[] }> {
    const since = await getLastPullAt();
    const response = await syncRequest<SyncPullResponse>({
        method: "GET",
        url: "/api/accounting/sync/pull",
        query: since ? { since } : undefined,
    });

    const changes = response.data?.changes ?? {};
    const updatedKeys: string[] = [];

    for (const [entity, items] of Object.entries(changes)) {
        const cacheKey = ENTITY_TO_CACHE[entity];
        if (!cacheKey || !Array.isArray(items)) continue;

        const existing = (await getCachedList<unknown[]>(cacheKey))?.data ?? [];
        const byId = new Map<string, unknown>();
        for (const item of existing) {
            const id = (item as { id?: string })?.id;
            if (id) byId.set(id, item);
        }
        for (const item of items) {
            const id = (item as { id?: string })?.id;
            if (id) byId.set(id, item);
        }
        await setCachedList(cacheKey, Array.from(byId.values()));
        updatedKeys.push(cacheKey);
    }

    const serverTime = response.data?.serverTime ?? new Date().toISOString();
    await setLastPullAt(serverTime);
    return { updatedKeys };
}
