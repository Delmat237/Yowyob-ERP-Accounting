import { unwrapApiData } from "@/lib/analytique/analytique-api";
import { mapEcritureDtoToUi, mapEcritureUiToDto } from "@/lib/analytique/analytique-mappers";
import type { EcritureAnalytique } from "@/lib/analytique/ecriture-analytique";
import { buildLignesImputation } from "@/lib/analytique/ecriture-lignes";
import { cacheEntity, removeCachedEntity } from "@/lib/offline/entity-cache";
import { isOfflineClientId, resolveServerId, setIdMapping } from "@/lib/offline/id-map";
import { isNetworkError, networkStatus } from "@/lib/offline/network-status";
import { syncRequest } from "@/lib/offline/sync-request";
import { ENTITY_ECRITURE_ANALYTIQUE, type OutboxOperation } from "@/lib/offline/types";
import type { ApiResponseWrapperEcritureAnalytiqueDto } from "@/src/lib2/models/ApiResponseWrapperEcritureAnalytiqueDto";
import type { ApiResponseWrapperObject } from "@/src/lib2/models/ApiResponseWrapperObject";

async function syncCreate(op: OutboxOperation, payload: EcritureAnalytique): Promise<void> {
    const lignes = payload.lignes?.length ? payload.lignes : buildLignesImputation(payload);
    const dto = mapEcritureUiToDto(
        { ...payload, lignes },
        { clientId: op.entityId, clientMutationId: op.clientMutationId },
    );
    const response = await syncRequest<ApiResponseWrapperEcritureAnalytiqueDto>(
        {
            method: "POST",
            url: "/api/accounting/analytique/ecritures",
            body: dto,
            mediaType: "application/json",
        },
        op.clientMutationId,
    );
    const saved = mapEcritureDtoToUi(unwrapApiData(response, "Synchronisation échouée."));
    await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, "synced");
    if (isOfflineClientId(op.entityId) && saved.id) {
        await setIdMapping(op.entityId, saved.id);
    }
    if (saved.id !== payload.id) {
        await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, payload.id, saved, "synced");
    }
}

/**
 * Handler de synchronisation des écritures analytiques vers l'API backend.
 */
export async function pushEcritureAnalytique(op: OutboxOperation): Promise<void> {
    const payload = op.payload as EcritureAnalytique;
    const action = op.action;

    try {
        if (action === "DELETE") {
            const serverId = await resolveServerId(op.entityId);
            if (isOfflineClientId(serverId)) {
                await removeCachedEntity(ENTITY_ECRITURE_ANALYTIQUE, op.entityId);
                networkStatus.reportApiSuccess();
                return;
            }
            await syncRequest<ApiResponseWrapperObject>(
                {
                    method: "DELETE",
                    url: "/api/accounting/analytique/ecritures/{id}",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            await removeCachedEntity(ENTITY_ECRITURE_ANALYTIQUE, op.entityId);
            await removeCachedEntity(ENTITY_ECRITURE_ANALYTIQUE, serverId);
            networkStatus.reportApiSuccess();
            return;
        }

        if (action === "CREATE" || (action === "UPDATE" && isOfflineClientId(payload.id))) {
            await syncCreate(op, payload);
            networkStatus.reportApiSuccess();
            return;
        }

        const serverId = await resolveServerId(op.entityId);

        if (action === "UPDATE" && payload.statut === "VALIDEE") {
            const response = await syncRequest<ApiResponseWrapperEcritureAnalytiqueDto>(
                {
                    method: "POST",
                    url: "/api/accounting/analytique/ecritures/{id}/valider",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            const saved = mapEcritureDtoToUi(unwrapApiData(response, "Validation échouée."));
            await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, "synced");
            networkStatus.reportApiSuccess();
            return;
        }

        if (action === "UPDATE" && payload.statut === "REJETEE") {
            const response = await syncRequest<ApiResponseWrapperEcritureAnalytiqueDto>(
                {
                    method: "POST",
                    url: "/api/accounting/analytique/ecritures/{id}/rejeter",
                    path: { id: serverId },
                    body: { raison: payload.rejectReason ?? "Rejet hors ligne" },
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            const saved = mapEcritureDtoToUi(unwrapApiData(response, "Rejet échoué."));
            await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, "synced");
            networkStatus.reportApiSuccess();
            return;
        }

        if (action === "UPDATE") {
            const lignes = payload.lignes?.length ? payload.lignes : buildLignesImputation(payload);
            const dto = mapEcritureUiToDto({ ...payload, lignes });
            const response = await syncRequest<ApiResponseWrapperEcritureAnalytiqueDto>(
                {
                    method: "PUT",
                    url: "/api/accounting/analytique/ecritures/{id}",
                    path: { id: serverId },
                    body: {
                        ...dto,
                        updatedAt: (payload as EcritureAnalytique & { updatedAt?: string }).updatedAt,
                    },
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            const saved = mapEcritureDtoToUi(unwrapApiData(response, "Mise à jour échouée."));
            await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, "synced");
            networkStatus.reportApiSuccess();
            return;
        }

        throw new Error(`Action non supportée : ${action}`);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur de synchronisation";
        if (message.includes("409") || message.toLowerCase().includes("conflit")) {
            throw new Error(`CONFLICT: ${message}`);
        }
        if (
            isNetworkError(err) ||
            message.includes("connexion") ||
            message.includes("Failed to fetch") ||
            message.includes("serveur")
        ) {
            networkStatus.reportApiNetworkFailure();
            throw new Error("Erreur de connexion — synchronisation en attente");
        }
        throw err instanceof Error ? err : new Error(message);
    }
}
