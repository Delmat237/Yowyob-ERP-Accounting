import type { EcritureAnalytique, StatutEcritureAnalytique } from "@/lib/analytique/ecriture-analytique";
import { buildLignesImputation } from "@/lib/analytique/ecriture-lignes";
import { cacheEntity, listCachedEntities, removeCachedEntity } from "@/lib/offline/entity-cache";
import { getDb } from "@/lib/offline/idb";
import { isMigrationDone, markMigrationDone, MIGRATION_KEY } from "@/lib/offline/migrate";
import { networkStatus } from "@/lib/offline/network-status";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { flushOutbox } from "@/lib/offline/sync-engine";
import { ENTITY_ECRITURE_ANALYTIQUE } from "@/lib/offline/types";

const LEGACY_STORAGE_KEY = "ksm.analytique.ecritures";

let memoryCache: EcritureAnalytique[] = [];
let initPromise: Promise<void> | null = null;

async function migrateFromLocalStorage(): Promise<void> {
    if (typeof window === "undefined") return;
    if (await isMigrationDone(MIGRATION_KEY)) return;

    try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
            const items = JSON.parse(raw) as EcritureAnalytique[];
            await Promise.all(
                items.map((item) =>
                    cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, item.id, item, "local_only"),
                ),
            );
            localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
    } catch {
        // migration best-effort
    }
    await markMigrationDone(MIGRATION_KEY);
}

async function hydrateMemoryCache(): Promise<void> {
    memoryCache = await listCachedEntities<EcritureAnalytique>(ENTITY_ECRITURE_ANALYTIQUE);
    memoryCache.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function initEcrituresAnalytiquesStore(): Promise<void> {
    if (!initPromise) {
        initPromise = (async () => {
            await getDb();
            await migrateFromLocalStorage();
            await hydrateMemoryCache();
        })();
    }
    return initPromise;
}

function sortCache(): void {
    memoryCache.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

async function persistEntry(
    entry: EcritureAnalytique,
    action: "CREATE" | "UPDATE" | "DELETE",
): Promise<void> {
    const syncStatus = networkStatus.isOnline() ? "pending" : "local_only";
    if (action === "DELETE") {
        await removeCachedEntity(ENTITY_ECRITURE_ANALYTIQUE, entry.id);
        await enqueueOutbox({
            entity: ENTITY_ECRITURE_ANALYTIQUE,
            action,
            entityId: entry.id,
            payload: entry,
            clientMutationId: `del-${entry.id}`,
        });
        memoryCache = memoryCache.filter((e) => e.id !== entry.id);
        return;
    }

    await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, entry.id, entry, syncStatus);
    await enqueueOutbox({
        entity: ENTITY_ECRITURE_ANALYTIQUE,
        action,
        entityId: entry.id,
        payload: entry,
        clientMutationId: `${action.toLowerCase()}-${entry.id}`,
    });

    const idx = memoryCache.findIndex((e) => e.id === entry.id);
    if (idx >= 0) memoryCache[idx] = entry;
    else memoryCache.push(entry);
    sortCache();

    if (networkStatus.isOnline()) {
        void flushOutbox();
    }
}

export function listEcrituresAnalytiques(): EcritureAnalytique[] {
    return [...memoryCache];
}

export function listEcrituresByStatut(statut: StatutEcritureAnalytique): EcritureAnalytique[] {
    return listEcrituresAnalytiques().filter((e) => e.statut === statut);
}

export function saveEcritureAnalytique(entry: EcritureAnalytique): EcritureAnalytique {
    const isNew = !memoryCache.some((e) => e.id === entry.id);
    void persistEntry(entry, isNew ? "CREATE" : "UPDATE");
    return entry;
}

export function createEcritureAnalytique(
    data: Omit<EcritureAnalytique, "id" | "createdAt" | "statut" | "lignes">,
): EcritureAnalytique {
    const lignes = buildLignesImputation(data);
    const entry: EcritureAnalytique = {
        ...data,
        lignes,
        id: `ea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        statut: "BROUILLON",
        createdAt: new Date().toISOString(),
    };
    return saveEcritureAnalytique(entry);
}

export function validateEcritureAnalytique(id: string): EcritureAnalytique | null {
    const idx = memoryCache.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const updated: EcritureAnalytique = {
        ...memoryCache[idx],
        statut: "VALIDEE",
        validatedAt: new Date().toISOString(),
        rejectReason: undefined,
    };
    saveEcritureAnalytique(updated);
    return updated;
}

export function rejectEcritureAnalytique(id: string, reason: string): EcritureAnalytique | null {
    const idx = memoryCache.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const updated: EcritureAnalytique = {
        ...memoryCache[idx],
        statut: "REJETEE",
        rejectReason: reason,
    };
    saveEcritureAnalytique(updated);
    return updated;
}

export function deleteEcritureAnalytique(id: string): void {
    const entry = memoryCache.find((e) => e.id === id);
    if (!entry) return;
    void persistEntry(entry, "DELETE");
}

export function countPiecesForYear(year: number): number {
    return listEcrituresAnalytiques().filter((e) =>
        e.numeroPiece.match(new RegExp(`^(CA|ECRIT-ANALYTIQUE)-${year}-`)),
    ).length;
}

export async function reloadEcrituresFromCache(): Promise<void> {
    await hydrateMemoryCache();
}
