import { listPendingOutbox, updateOutboxStatus } from "@/lib/offline/outbox";
import { setIdMapping, isOfflineClientId } from "@/lib/offline/id-map";
import { isSyncConflictMessage } from "@/lib/offline/conflict";
import { syncRequest } from "@/lib/offline/sync-request";
import type { OutboxOperation } from "@/lib/offline/types";

const BATCH_ENTITIES = new Set([
    "cg.journaux",
    "cg.taxes",
    "cg.devises",
    "cg.operations",
    "cg.plan_comptable",
    "cg.periodes",
    "ca.centres",
    "ca.charges",
    "ca.comptes",
    "ca.plan_comptes",
    "ca.journaux",
    "ecriture_analytique",
]);

const BATCH_ACTIONS = new Set(["CREATE", "UPDATE", "DELETE"]);

type SyncPushResponse = {
    success?: boolean;
    data?: {
        results?: Array<{
            clientMutationId?: string;
            entityId?: string;
            status?: string;
            message?: string;
            data?: { id?: string };
        }>;
        synced?: number;
        failed?: number;
        alreadyProcessed?: number;
    };
};

function isBatchable(op: OutboxOperation): boolean {
    return BATCH_ENTITIES.has(op.entity) && BATCH_ACTIONS.has(op.action);
}

/**
 * Pousse en batch les opérations CG/CA CREATE/UPDATE/DELETE via
 * `POST /api/accounting/sync/push`. Retourne les ops non couvertes (à traiter unitairement).
 */
export async function flushCgBatch(
    queue: OutboxOperation[],
): Promise<{ remaining: OutboxOperation[]; synced: number; failed: number }> {
    const batchOps = queue.filter(isBatchable);
    const remaining = queue.filter((op) => !isBatchable(op));

    if (batchOps.length === 0) {
        return { remaining: queue, synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    try {
        const response = await syncRequest<SyncPushResponse>({
            method: "POST",
            url: "/api/accounting/sync/push",
            body: {
                operations: batchOps.map((op) => ({
                    clientMutationId: op.clientMutationId,
                    entity: op.entity,
                    action: op.action,
                    entityId: op.entityId,
                    payload: op.payload as Record<string, unknown>,
                })),
            },
            mediaType: "application/json",
        });

        const results = response.data?.results ?? [];
        const byMutation = new Map(results.map((r) => [r.clientMutationId, r]));

        for (const op of batchOps) {
            const result = byMutation.get(op.clientMutationId);
            const status = result?.status ?? "FAILED";
            const message = result?.message ?? "Échec batch sync";
            if (status === "CREATED" || status === "OK" || status === "DELETED" || status === "ALREADY_PROCESSED") {
                const serverId = result?.data?.id ?? result?.entityId;
                if (serverId && isOfflineClientId(op.entityId) && op.action === "CREATE") {
                    await setIdMapping(op.entityId, String(serverId));
                }
                await updateOutboxStatus(op.id, "done");
                synced += 1;
            } else if (status === "SKIPPED") {
                remaining.push(op);
            } else if (status === "CONFLICT" || isSyncConflictMessage(message)) {
                await updateOutboxStatus(op.id, "conflict", {
                    retries: op.retries + 1,
                    lastError: message,
                });
                failed += 1;
                if (typeof window !== "undefined") {
                    window.dispatchEvent(
                        new CustomEvent("sync:conflict", {
                            detail: {
                                outboxId: op.id,
                                entity: op.entity,
                                entityId: op.entityId,
                                action: op.action,
                                message,
                            },
                        }),
                    );
                }
            } else {
                await updateOutboxStatus(op.id, "failed", {
                    retries: op.retries + 1,
                    lastError: message,
                });
                failed += 1;
            }
        }
    } catch (err) {
        // En cas d'échec batch, retomber sur le flush unitaire
        remaining.push(...batchOps);
        console.warn("[offline] batch push failed, fallback unitaire:", err);
    }

    return { remaining, synced, failed };
}

export async function listBatchablePending(): Promise<OutboxOperation[]> {
    const pending = await listPendingOutbox();
    return pending.filter(isBatchable);
}
