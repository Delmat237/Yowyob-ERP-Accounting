import { mutateWithOfflineOutbox } from "@/lib/offline/mutate-with-outbox";
import { getCachedList, removeFromCachedList, setCachedList, upsertInCachedList } from "@/lib/offline/list-cache";
import type { OfflinePendingMeta } from "@/lib/offline/types";

function markPending<T extends { id?: string }>(item: T, queued: boolean): T & OfflinePendingMeta {
    if (!queued || !item.id) return item;
    return { ...item, _offlinePending: true, _clientId: item.id };
}

/**
 * CRUD optimiste sur une liste cachée : applique un patch local immédiatement,
 * puis exécute l'API ou file l'opération dans l'outbox si hors ligne.
 */
export async function upsertListItemWithOutbox<T extends { id?: string }>({
    cacheKey,
    entity,
    action,
    item,
    onlineMutator,
}: {
    cacheKey: string;
    entity: string;
    action: "CREATE" | "UPDATE";
    item: T;
    onlineMutator: () => Promise<unknown>;
}): Promise<{ queued: boolean; id: string }> {
    const id = String(item.id);

    const result = await mutateWithOfflineOutbox<unknown>({
        entity,
        action,
        entityId: id,
        payload: item,
        onlineMutator,
    });

    await upsertInCachedList(cacheKey, markPending({ ...item, id }, result.queued));

    return { queued: result.queued, id };
}

export async function removeListItemWithOutbox({
    cacheKey,
    entity,
    entityId,
    onlineMutator,
}: {
    cacheKey: string;
    entity: string;
    entityId: string;
    onlineMutator: () => Promise<unknown>;
}): Promise<{ queued: boolean }> {
    await removeFromCachedList(cacheKey, entityId);

    const result = await mutateWithOfflineOutbox<unknown>({
        entity,
        action: "DELETE",
        entityId,
        payload: { id: entityId },
        onlineMutator,
    });

    return { queued: result.queued };
}

/**
 * Pour les listes calculées (ex: devises = currencies + rates) : stocke une liste entière.
 */
export async function replaceListWithOutbox<T>({
    cacheKey,
    entity,
    action,
    entityId,
    nextList,
    onlineMutator,
    payload,
}: {
    cacheKey: string;
    entity: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entityId: string;
    nextList: T;
    onlineMutator: () => Promise<unknown>;
    payload: unknown;
}): Promise<{ queued: boolean }> {
    const result = await mutateWithOfflineOutbox<unknown>({
        entity,
        action,
        entityId,
        payload,
        onlineMutator,
    });

    const toStore =
        result.queued && Array.isArray(nextList)
            ? (nextList as { id?: string }[]).map((item) => markPending(item, true))
            : nextList;

    await setCachedList(cacheKey, toStore);
    return { queued: result.queued };
}

export async function getCachedListData<T>(cacheKey: string, fallback: T): Promise<T> {
    const cached = await getCachedList<T>(cacheKey);
    return cached?.data ?? fallback;
}

