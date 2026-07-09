import { markEntitySynced } from "@/lib/offline/entity-cache";
import { pushEcritureComptable } from "@/lib/offline/handlers/ecriture-comptable-sync";
import {
    pushCgBudget,
    pushCgDevise,
    pushCgDeviseRate,
    pushCgExercice,
    pushCgJournal,
    pushCgOperation,
    pushCgPeriode,
    pushCgPlanComptable,
    pushCgTaxe,
} from "@/lib/offline/handlers/cg-list-sync";
import { networkStatus } from "@/lib/offline/network-status";
import { listPendingOutbox, updateOutboxStatus } from "@/lib/offline/outbox";
import { idempotencyHeaders } from "@/lib/offline/sync-request";
import type { OutboxOperation } from "@/lib/offline/types";
import {
    ENTITY_ECRITURE_ANALYTIQUE,
    ENTITY_ECRITURE_COMPTABLE,
    ENTITY_NOTIFICATIONS,
} from "@/lib/offline/types";
import { pushEcritureAnalytique } from "@/lib/offline/handlers/ecriture-analytique-sync";
import { pushCaMockList } from "@/lib/offline/handlers/ca-mock-sync";

type SyncHandler = (op: OutboxOperation) => Promise<void>;

async function pushNotificationRead(op: OutboxOperation): Promise<void> {
    const payload = op.payload as { id: string };
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const organizationId =
        typeof window !== "undefined" ? localStorage.getItem("organization_id") : null;
    const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") : null;

    const response = await fetch(`${apiBase}/api/accounting/notifications/${payload.id}/read`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token ?? ""}`,
            "X-Organization-Id": organizationId ?? "",
            "X-Tenant-Id": tenantId ?? "",
            ...idempotencyHeaders(op.clientMutationId),
        },
    });

    if (!response.ok) {
        throw new Error(`Échec marquage notification lue (${response.status})`);
    }
}

const handlers: Record<string, SyncHandler> = {
    [ENTITY_ECRITURE_ANALYTIQUE]: async (op) => {
        await pushEcritureAnalytique(op);
        await markEntitySynced(ENTITY_ECRITURE_ANALYTIQUE, op.entityId);
    },
    [ENTITY_ECRITURE_COMPTABLE]: async (op) => {
        await pushEcritureComptable(op);
    },
    [ENTITY_NOTIFICATIONS]: pushNotificationRead,
    "cg.operations": pushCgOperation,
    "cg.taxes": pushCgTaxe,
    "cg.devises": pushCgDevise,
    "cg.devises_rates": pushCgDeviseRate,
    "cg.journaux": pushCgJournal,
    "cg.plan_comptable": pushCgPlanComptable,
    "cg.exercices": pushCgExercice,
    "cg.budgets": pushCgBudget,
    "cg.periodes": pushCgPeriode,
    "ca.centres": pushCaMockList,
    "ca.charges": pushCaMockList,
    "ca.comptes": pushCaMockList,
    "ca.plan_comptes": pushCaMockList,
    "ca.journaux": pushCaMockList,
};

let flushing = false;

export async function flushOutbox(): Promise<{ synced: number; failed: number; pending: number }> {
    if (flushing || !networkStatus.isOnline()) {
        const pending = (await listPendingOutbox()).length;
        return { synced: 0, failed: 0, pending };
    }

    flushing = true;
    let synced = 0;
    let failed = 0;

    try {
        const queue = await listPendingOutbox();
        for (const op of queue) {
            if (!networkStatus.isOnline()) break;

            const handler = handlers[op.entity];
            if (!handler) {
                await updateOutboxStatus(op.id, "failed", {
                    lastError: `Pas de handler sync pour ${op.entity}`,
                });
                failed += 1;
                continue;
            }

            await updateOutboxStatus(op.id, "syncing");
            try {
                await handler(op);
                await updateOutboxStatus(op.id, "done");
                networkStatus.reportApiSuccess();
                synced += 1;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Erreur de synchronisation";
                const isApiUnavailable = message.includes("non disponible");
                const isNetwork =
                    message.includes("connexion") ||
                    message.includes("Failed to fetch") ||
                    message.includes("serveur");

                if (isApiUnavailable) {
                    await updateOutboxStatus(op.id, "pending", { lastError: message });
                    break;
                }
                if (isNetwork && op.retries < 4) {
                    await updateOutboxStatus(op.id, "pending", {
                        retries: op.retries + 1,
                        lastError: message,
                    });
                    break;
                }
                await updateOutboxStatus(op.id, "failed", {
                    retries: op.retries + 1,
                    lastError: message,
                });
                failed += 1;
            }
        }
    } finally {
        flushing = false;
    }

    const pending = (await listPendingOutbox()).length;
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("sync:complete", { detail: { synced, failed, pending } }),
        );
    }
    return { synced, failed, pending };
}
