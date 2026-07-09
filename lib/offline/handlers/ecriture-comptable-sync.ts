import { resolveServerId, setIdMapping, isOfflineClientId } from "@/lib/offline/id-map";
import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { setCachedList, getCachedList } from "@/lib/offline/list-cache";
import type { OutboxOperation } from "@/lib/offline/types";
import { AccountingEntriesService } from "@/src/lib2/services/AccountingEntriesService";
import type { EcritureComptableDto } from "@/src/lib2/models/EcritureComptableDto";
import type { EcritureComptableOfflineDto } from "@/lib/offline/cg-ecritures-offline";

function stripForApi(entry: EcritureComptableOfflineDto): EcritureComptableDto {
    const { _offlinePending, _clientId, ...rest } = entry;
    if (isOfflineClientId(rest.id)) {
        const { id: _id, ...body } = rest;
        return body;
    }
    return rest;
}

async function refreshCachesFromServer(): Promise<void> {
    const response = await AccountingEntriesService.getAll1();
    if (response?.success === false || !response?.data) return;
    await setCachedList(CG_CACHE_KEYS.ECRITURES, response.data);
    const nonValidated = await AccountingEntriesService.getNonValidated();
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
            const response = await AccountingEntriesService.createEcriture(body);
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
            const response = await AccountingEntriesService.updateEcriture(serverId, body);
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec mise à jour écriture");
            }
            break;
        }
        case "DELETE": {
            const response = await AccountingEntriesService.delete(serverId);
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec suppression écriture");
            }
            break;
        }
        case "VALIDATE": {
            const response = await AccountingEntriesService.validateEcriture(serverId);
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec validation écriture");
            }
            break;
        }
        case "DEACTIVATE": {
            const response = await AccountingEntriesService.deactivate(serverId);
            if (response?.success === false) {
                throw new Error(response.message ?? "Échec désactivation écriture");
            }
            break;
        }
        default:
            throw new Error(`Action sync non supportée : ${op.action}`);
    }

    await refreshCachesFromServer();

    // Retirer le marqueur pending local si présent
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
