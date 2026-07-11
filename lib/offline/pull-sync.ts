import { CA_CACHE_KEYS, CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { setCachedList, getCachedList } from "@/lib/offline/list-cache";
import { cacheEntity } from "@/lib/offline/entity-cache";
import { syncRequest } from "@/lib/offline/sync-request";
import { idbGet, idbPut } from "@/lib/offline/idb";
import {
    ENTITY_ECRITURE_ANALYTIQUE,
    type MetaEntry,
} from "@/lib/offline/types";
import { mapEcritureDtoToUi } from "@/lib/analytique/analytique-mappers";
import type { EcritureAnalytiqueDto } from "@/src/lib2/models/EcritureAnalytiqueDto";

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
    "ca.centres": CA_CACHE_KEYS.CENTRES,
    "ca.charges": CA_CACHE_KEYS.CHARGES,
    "ca.comptes": CA_CACHE_KEYS.COMPTES,
    "ca.journaux": CA_CACHE_KEYS.JOURNAUX,
};

/** Horodatage du dernier pull réussi (ISO). */
export async function getLastPullAt(): Promise<string | undefined> {
    const entry = await idbGet<MetaEntry>("meta", LAST_PULL_KEY);
    return typeof entry?.value === "string" ? entry.value : undefined;
}

async function setLastPullAt(iso: string): Promise<void> {
    await idbPut("meta", { key: LAST_PULL_KEY, value: iso } satisfies MetaEntry);
}

async function mergeListCache(cacheKey: string, items: unknown[]): Promise<void> {
    const existing = (await getCachedList<unknown[]>(cacheKey))?.data ?? [];
    const byId = new Map<string, unknown>();
    for (const item of existing) {
        const id = (item as { id?: string })?.id;
        if (id) byId.set(String(id), item);
    }
    for (const item of items) {
        const id = (item as { id?: string })?.id;
        if (id) byId.set(String(id), item);
    }
    await setCachedList(cacheKey, Array.from(byId.values()));
}

async function mergeEcrituresAnalytiques(items: unknown[]): Promise<void> {
    for (const item of items) {
        try {
            const ui = mapEcritureDtoToUi(item as EcritureAnalytiqueDto);
            if (!ui.id) continue;
            await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, ui.id, ui, "synced");
        } catch (err) {
            console.warn("[offline] pull ecriture_analytique skip:", err);
        }
    }
}

/**
 * Pull incrémental depuis le backend (`GET /api/accounting/sync/pull?since=`).
 * Fusionne les listes CG/CA changées dans IndexedDB.
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
        if (!Array.isArray(items) || items.length === 0) continue;

        if (entity === "ecriture_analytique") {
            await mergeEcrituresAnalytiques(items);
            updatedKeys.push(ENTITY_ECRITURE_ANALYTIQUE);
            continue;
        }

        const cacheKey = ENTITY_TO_CACHE[entity];
        if (!cacheKey) continue;

        await mergeListCache(cacheKey, items);
        updatedKeys.push(cacheKey);

        // Plan de comptes CA = miroir des comptes
        if (entity === "ca.comptes") {
            await mergeListCache(CA_CACHE_KEYS.PLAN_COMPTES, items);
            updatedKeys.push(CA_CACHE_KEYS.PLAN_COMPTES);
        }
    }

    const serverTime = response.data?.serverTime ?? new Date().toISOString();
    await setLastPullAt(serverTime);
    return { updatedKeys };
}
