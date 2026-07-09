import Dexie, { type Table } from 'dexie';

export type EntitySyncStatus = 'synced' | 'pending' | 'local_only';

export type OutboxAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type OutboxStatus = 'pending' | 'syncing' | 'done' | 'failed' | 'conflict';

export interface CachedEntity<T = unknown> {
  key: string;
  entity: string;
  entityId: string;
  data: T;
  updatedAt: string;
  syncStatus: EntitySyncStatus;
}

export interface OutboxEntry<T = unknown> {
  id: string;
  entity: string;
  action: OutboxAction;
  entityId: string;
  payload: T;
  clientMutationId: string;
  createdAt: string;
  status: OutboxStatus;
  retries: number;
  lastError: string | null;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

export const ENTITY_ECRITURE_ANALYTIQUE = 'ecriture_analytique';

class OfflineDatabase extends Dexie {
  entities!: Table<CachedEntity, string>;
  outbox!: Table<OutboxEntry, string>;
  meta!: Table<MetaEntry, string>;

  constructor() {
    super('yowyob-offline');
    this.version(1).stores({
      entities: 'key, entity, entityId, updatedAt',
      outbox: 'id, entity, entityId, status, createdAt',
      meta: 'key',
    });
  }
}

export const offlineDb = new OfflineDatabase();

export function entityKey(entity: string, entityId: string): string {
  return `${entity}:${entityId}`;
}

export async function getMetaValue<T>(key: string): Promise<T | undefined> {
  const row = await offlineDb.meta.get(key);
  return row?.value as T | undefined;
}

export async function setMetaValue(key: string, value: unknown): Promise<void> {
  await offlineDb.meta.put({ key, value });
}

export async function upsertEntity<T>(
  entity: string,
  entityId: string,
  data: T,
  syncStatus: EntitySyncStatus,
): Promise<void> {
  const key = entityKey(entity, entityId);
  await offlineDb.entities.put({
    key,
    entity,
    entityId,
    data,
    updatedAt: new Date().toISOString(),
    syncStatus,
  });
}

export async function getEntity<T>(entity: string, entityId: string): Promise<CachedEntity<T> | undefined> {
  return offlineDb.entities.get(entityKey(entity, entityId)) as Promise<CachedEntity<T> | undefined>;
}

export async function listEntitiesByType<T>(entity: string): Promise<T[]> {
  const rows = await offlineDb.entities.where('entity').equals(entity).toArray();
  return rows.map((row) => row.data as T);
}

export async function replaceEntitiesOfType<T>(
  entity: string,
  items: Array<{ entityId: string; data: T }>,
  syncStatus: EntitySyncStatus = 'synced',
): Promise<void> {
  await offlineDb.transaction('rw', offlineDb.entities, async () => {
    const keys = await offlineDb.entities.where('entity').equals(entity).primaryKeys();
    if (keys.length > 0) {
      await offlineDb.entities.bulkDelete(keys);
    }
    const now = new Date().toISOString();
    await offlineDb.entities.bulkPut(
      items.map((item) => ({
        key: entityKey(entity, item.entityId),
        entity,
        entityId: item.entityId,
        data: item.data,
        updatedAt: now,
        syncStatus,
      })),
    );
  });
}

export async function updateEntitySyncStatus(
  entity: string,
  entityId: string,
  syncStatus: EntitySyncStatus,
): Promise<void> {
  const key = entityKey(entity, entityId);
  const row = await offlineDb.entities.get(key);
  if (!row) return;
  await offlineDb.entities.put({
    ...row,
    syncStatus,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeEntity(entity: string, entityId: string): Promise<void> {
  await offlineDb.entities.delete(entityKey(entity, entityId));
}
