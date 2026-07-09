import { idbDelete, idbGetAll, idbGetAllByIndex, idbPut } from "@/lib/offline/idb";
import type { OutboxAction, OutboxOperation, OutboxStatus } from "@/lib/offline/types";

const PENDING_STATUSES: OutboxStatus[] = ["pending", "failed"];

function newId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueueOutbox<T>(params: {
    entity: string;
    action: OutboxAction;
    entityId: string;
    payload: T;
    clientMutationId?: string;
}): Promise<OutboxOperation<T>> {
    const op: OutboxOperation<T> = {
        id: newId(),
        entity: params.entity,
        action: params.action,
        entityId: params.entityId,
        payload: params.payload,
        clientMutationId: params.clientMutationId ?? newId(),
        createdAt: new Date().toISOString(),
        status: "pending",
        retries: 0,
    };
    await idbPut("outbox", op);
    return op;
}

export async function listPendingOutbox(): Promise<OutboxOperation[]> {
    const all = await idbGetAll<OutboxOperation>("outbox");
    return all
        .filter((op) => PENDING_STATUSES.includes(op.status) && op.retries < 5)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function countPendingOutbox(): Promise<number> {
    const pending = await listPendingOutbox();
    return pending.length;
}

export async function updateOutboxStatus(
    id: string,
    status: OutboxStatus,
    patch?: Partial<Pick<OutboxOperation, "retries" | "lastError">>,
): Promise<void> {
    const all = await idbGetAll<OutboxOperation>("outbox");
    const current = all.find((op) => op.id === id);
    if (!current) return;
    await idbPut("outbox", {
        ...current,
        status,
        retries: patch?.retries ?? current.retries,
        lastError: patch?.lastError,
    });
}

export async function listOutboxByEntity(entity: string): Promise<OutboxOperation[]> {
    return idbGetAllByIndex<OutboxOperation>("outbox", "entity", entity);
}

export async function purgeDoneOutbox(olderThanDays = 7): Promise<void> {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const all = await idbGetAll<OutboxOperation>("outbox");
    const toDelete = all.filter(
        (op) => op.status === "done" && new Date(op.createdAt).getTime() < cutoff,
    );
    await Promise.all(toDelete.map((op) => idbDelete("outbox", op.id)));
}
