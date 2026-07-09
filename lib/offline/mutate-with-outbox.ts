import { networkStatus, isNetworkError } from "@/lib/offline/network-status";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { flushOutbox } from "@/lib/offline/sync-engine";
import type { OutboxAction } from "@/lib/offline/types";

export type MutateOfflineResult<T> = {
    queued: boolean;
    data?: T;
};

type ApiLike = { success?: boolean; message?: string; data?: unknown };

function isApiFailure(response: unknown): boolean {
    if (response == null) return true;
    if (typeof response === "object" && "success" in response) {
        return (response as ApiLike).success === false;
    }
    return false;
}

function extractData<T>(response: unknown): T | undefined {
    if (response != null && typeof response === "object" && "data" in response) {
        return (response as { data?: T }).data;
    }
    return response as T;
}

/**
 * Online-first : tente l'API ; en cas d'échec réseau ou hors ligne, file d'attente + patch local.
 */
export async function mutateWithOfflineOutbox<T>({
    entity,
    action,
    entityId,
    payload,
    clientMutationId,
    onlineMutator,
    onQueued,
}: {
    entity: string;
    action: OutboxAction;
    entityId: string;
    payload: unknown;
    clientMutationId?: string;
    onlineMutator: () => Promise<unknown>;
    onQueued?: () => Promise<void>;
}): Promise<MutateOfflineResult<T>> {
    if (networkStatus.isOnline()) {
        try {
            const response = await onlineMutator();
            if (!isApiFailure(response)) {
                networkStatus.reportApiSuccess();
                const data = extractData<T>(response);
                void flushOutbox();
                return { queued: false, data };
            }
            const message = (response as ApiLike)?.message;
            if (message && !message.includes("connexion") && !message.includes("serveur")) {
                throw new Error(message);
            }
            networkStatus.reportApiNetworkFailure();
        } catch (error) {
            if (!isNetworkError(error) && error instanceof Error) {
                throw error;
            }
            networkStatus.reportApiNetworkFailure();
        }
    }

    await enqueueOutbox({
        entity,
        action,
        entityId,
        payload,
        clientMutationId: clientMutationId ?? `${action.toLowerCase()}-${entityId}`,
    });

    if (onQueued) await onQueued();

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sync:complete", { detail: { synced: 0, failed: 0, pending: 1 } }));
    }

    if (networkStatus.isOnline()) {
        void flushOutbox();
    }

    return { queued: true };
}
