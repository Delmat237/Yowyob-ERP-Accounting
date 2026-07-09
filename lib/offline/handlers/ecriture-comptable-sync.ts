import { resolveServerId, setIdMapping, isOfflineClientId } from "@/lib/offline/id-map";
import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { setCachedList, getCachedList } from "@/lib/offline/list-cache";
import type { OutboxOperation } from "@/lib/offline/types";
import type { EcritureComptableDto } from "@/src/lib2/models/EcritureComptableDto";
import type { ApiResponseWrapperEcritureComptableDto } from "@/src/lib2/models/ApiResponseWrapperEcritureComptableDto";
import type { ApiResponseWrapperListEcritureComptableDto } from "@/src/lib2/models/ApiResponseWrapperListEcritureComptableDto";
import type { ApiResponseWrapperObject } from "@/src/lib2/models/ApiResponseWrapperObject";
import type { EcritureComptableOfflineDto } from "@/lib/offline/cg-ecritures-offline";
import { syncRequest } from "@/lib/offline/sync-request";

function stripForApi(entry: EcritureComptableOfflineDto): EcritureComptableDto {
    const { _offlinePending, _clientId, ...rest } = entry;
    const clientId = _clientId ?? (isOfflineClientId(rest.id) ? rest.id : undefined);
    if (isOfflineClientId(rest.id)) {
        const { id: _id, ...body } = rest;
        return { ...body, ...(clientId ? { clientId } : {}) };
    }
    return { ...rest, ...(clientId ? { clientId } : {}) };
}

async function refreshCachesFromServer(): Promise<void> {
    const response = await syncRequest<ApiResponseWrapperListEcritureComptableDto>(
        { method: "GET", url: "/api/accounting/ecritures" },
    );
    if (response?.success === false || !response?.data) return;
    await setCachedList(CG_CACHE_KEYS.ECRITURES, response.data);
    const nonValidated = await syncRequest<ApiResponseWrapperListEcritureComptableDto>(
        { method: "GET", url: "/api/accounting/ecritures/non-validated" },
    );
    if (nonValidated?.data) {
        await setCachedList(CG_CACHE_KEYS.ECRITURES_NON_VALIDATED, nonValidated.data);
    }
}

export async function pushEcritureComptable(op: OutboxOperation): Promise<void> {
    const payload = op.payload as EcritureComptableOfflineDto | { id: string };
    const serverId = await resolveServerId(op.entityId);

    switch (op.action) {
        case "CREATE": {
            const body = stripForApi(payload as EcritureComptableOfflineDto);
            const response = await syncRequest<ApiResponseWrapperEcritureComptableDto>(
                {
                    method: "POST",
                    url: "/api/accounting/ecritures",
                    body,
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec création écriture");
            }
            if (response?.data?.id && isOfflineClientId(op.entityId)) {
                await setIdMapping(op.entityId, response.data.id);
            }
            break;
        }
        case "UPDATE": {
            const body = stripForApi(payload as EcritureComptableOfflineDto);
            const response = await syncRequest<ApiResponseWrapperEcritureComptableDto>(
                {
                    method: "PUT",
                    url: "/api/accounting/ecritures/{id}",
                    path: { id: serverId },
                    body,
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec mise à jour écriture");
            }
            break;
        }
        case "DELETE": {
            const response = await syncRequest<ApiResponseWrapperObject>(
                {
                    method: "DELETE",
                    url: "/api/accounting/ecritures/{id}",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec suppression écriture");
            }
            break;
        }
        case "VALIDATE": {
            const response = await syncRequest<ApiResponseWrapperEcritureComptableDto>(
                {
                    method: "POST",
                    url: "/api/accounting/ecritures/{id}/validate",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec validation écriture");
            }
            break;
        }
        case "DEACTIVATE": {
            const response = await syncRequest<ApiResponseWrapperObject>(
                {
                    method: "PATCH",
                    url: "/api/accounting/ecritures/{id}/deactivate",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec désactivation écriture");
            }
            break;
        }
        default:
            throw new Error(`Action sync non supportée : ${op.action}`);
    }

    await refreshCachesFromServer();

    const cached = await getCachedList<EcritureComptableDto[]>(CG_CACHE_KEYS.ECRITURES);
    if (cached?.data) {
        const cleaned = cached.data.map((e) => {
            if (e.id === op.entityId || e.id === serverId) {
                const { _offlinePending, _clientId, ...rest } = e as EcritureComptableOfflineDto;
                return rest;
            }
            return e;
        });
        await setCachedList(CG_CACHE_KEYS.ECRITURES, cleaned);
    }
}
