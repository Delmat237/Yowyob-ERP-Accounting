import type { ApiRequestOptions } from "@/src/lib2/core/ApiRequestOptions";
import { OpenAPI } from "@/src/lib2/core/OpenAPI";
import { request } from "@/src/lib2/core/request";
import type { CancelablePromise } from "@/src/lib2/core/CancelablePromise";

/** En-têtes d'idempotence pour les mutations offline rejouées. */
export function idempotencyHeaders(clientMutationId?: string): Record<string, string> {
    if (!clientMutationId) return {};
    return { "Idempotency-Key": clientMutationId };
}

/**
 * Appel API OpenAPI avec en-tête Idempotency-Key (clientMutationId de l'outbox).
 */
export function syncRequest<T>(
    options: ApiRequestOptions,
    clientMutationId?: string,
): CancelablePromise<T> {
    return request<T>(OpenAPI, {
        ...options,
        headers: {
            ...options.headers,
            ...idempotencyHeaders(clientMutationId),
        },
    });
}
