import { idbDelete, idbGet, idbGetAllByIndex, idbPut } from "@/lib/offline/idb";
import type { CachedEntity, EntitySyncStatus } from "@/lib/offline/types";

function entityKey(entity: string, entityId: string): string {
    return `${entity}:${entityId}`;
}

export async function cacheEntity<T>(
    entity: string,
    entityId: string,
    data: T,
    syncStatus: EntitySyncStatus = "pending",
): Promise<void> {
    const record: CachedEntity<T> = {
        key: entityKey(entity, entityId),
        entity,
        entityId,
        data,
        updatedAt: new Date().toISOString(),
        syncStatus,
    };
    await idbPut("entities", record);
}

export async function getCachedEntity<T>(entity: string, entityId: string): Promise<T | undefined> {
    const record = await idbGet<CachedEntity<T>>("entities", entityKey(entity, entityId));
    return record?.data;
}

export async function listCachedEntities<T>(entity: string): Promise<T[]> {
    const records = await idbGetAllByIndex<CachedEntity<T>>("entities", "entity", entity);
    return records.map((r) => r.data);
}

export async function removeCachedEntity(entity: string, entityId: string): Promise<void> {
    await idbDelete("entities", entityKey(entity, entityId));
}

export async function markEntitySynced(entity: string, entityId: string): Promise<void> {
    const record = await idbGet<CachedEntity>("entities", entityKey(entity, entityId));
    if (!record) return;
    await idbPut("entities", { ...record, syncStatus: "synced", updatedAt: new Date().toISOString() });
}
