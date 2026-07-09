export type OutboxStatus = "pending" | "syncing" | "done" | "failed" | "conflict";
export type OutboxAction = "CREATE" | "UPDATE" | "DELETE" | "VALIDATE" | "DEACTIVATE";
export type EntitySyncStatus = "synced" | "pending" | "local_only";

export const ENTITY_ECRITURE_ANALYTIQUE = "ecriture_analytique";
export const ENTITY_ECRITURE_COMPTABLE = "ecriture_comptable";
export const ENTITY_NOTIFICATIONS = "notifications";

/** Marqueur sur les écritures CG créées/modifiées hors ligne. */
export type OfflinePendingMeta = {
    _offlinePending?: boolean;
    _clientId?: string;
};

export interface CachedEntity<T = unknown> {
    key: string;
    entity: string;
    entityId: string;
    data: T;
    updatedAt: string;
    syncStatus: EntitySyncStatus;
}

export interface OutboxOperation<T = unknown> {
    id: string;
    entity: string;
    action: OutboxAction;
    entityId: string;
    payload: T;
    clientMutationId: string;
    createdAt: string;
    status: OutboxStatus;
    retries: number;
    lastError?: string;
}

export interface MetaEntry {
    key: string;
    value: unknown;
}
