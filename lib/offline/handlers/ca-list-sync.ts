import { CA_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { setCachedList } from "@/lib/offline/list-cache";
import { isOfflineClientId, resolveServerId, setIdMapping } from "@/lib/offline/id-map";
import { syncRequest } from "@/lib/offline/sync-request";
import type { OutboxOperation } from "@/lib/offline/types";
import type { AxeAnalytiqueDto } from "@/src/lib2/models/AxeAnalytiqueDto";
import type { ChargeAnalytiqueDto } from "@/src/lib2/models/ChargeAnalytiqueDto";
import type { CompteAnalytiqueDto } from "@/src/lib2/models/CompteAnalytiqueDto";
import type { JournalAnalytiqueDto } from "@/src/lib2/models/JournalAnalytiqueDto";
import { AccountingAnalyticsService } from "@/src/lib2/services/AccountingAnalyticsService";
import { AccountingChargesAnalytiquesService } from "@/src/lib2/services/AccountingChargesAnalytiquesService";
import { AccountingComptesAnalytiquesService } from "@/src/lib2/services/AccountingComptesAnalytiquesService";
import { AccountingJournauxAnalytiquesService } from "@/src/lib2/services/AccountingJournauxAnalytiquesService";

type ApiResponse = { success?: boolean; message?: string; data?: { id?: string } };

function stripLocalId<T extends { id?: string }>(body: T): T {
    if (!body.id || isOfflineClientId(body.id)) {
        const { id: _removed, ...rest } = body;
        return rest as T;
    }
    return body;
}

function assertSuccess(response: ApiResponse | null | undefined, label: string) {
    if (response?.success === false) {
        throw new Error(response.message ?? `Échec ${label}`);
    }
}

function createCaCrudHandler<T extends { id?: string }>(config: {
    label: string;
    createUrl: string;
    updateUrl: string;
    deleteUrl?: string;
    refresh: () => Promise<void>;
}): (op: OutboxOperation) => Promise<void> {
    return async (op: OutboxOperation) => {
        const payload = op.payload as T;
        const serverId = await resolveServerId(op.entityId);

        switch (op.action) {
            case "CREATE": {
                const res = await syncRequest<ApiResponse>(
                    {
                        method: "POST",
                        url: config.createUrl,
                        body: stripLocalId(payload),
                        mediaType: "application/json",
                    },
                    op.clientMutationId,
                );
                assertSuccess(res, `création ${config.label}`);
                if (res.data?.id) await setIdMapping(op.entityId, res.data.id);
                break;
            }
            case "UPDATE": {
                const res = await syncRequest<ApiResponse>(
                    {
                        method: "PUT",
                        url: config.updateUrl,
                        path: { id: serverId },
                        body: { ...payload, id: serverId },
                        mediaType: "application/json",
                    },
                    op.clientMutationId,
                );
                assertSuccess(res, `mise à jour ${config.label}`);
                break;
            }
            case "DELETE": {
                if (!config.deleteUrl) throw new Error(`Suppression non supportée : ${config.label}`);
                const res = await syncRequest<ApiResponse>(
                    {
                        method: "DELETE",
                        url: config.deleteUrl,
                        path: { id: serverId },
                    },
                    op.clientMutationId,
                );
                assertSuccess(res, `suppression ${config.label}`);
                break;
            }
            default:
                throw new Error(`Action non supportée : ${op.action}`);
        }

        await config.refresh();
    };
}

async function refreshCentresCache(): Promise<void> {
    const res = await AccountingAnalyticsService.getAllAxes();
    if (res.data) await setCachedList(CA_CACHE_KEYS.CENTRES, res.data);
}

async function refreshChargesCache(): Promise<void> {
    const res = await AccountingChargesAnalytiquesService.getAllCharges();
    if (res.data) await setCachedList(CA_CACHE_KEYS.CHARGES, res.data);
}

async function refreshComptesCache(): Promise<void> {
    const res = await AccountingComptesAnalytiquesService.getAllComptes();
    if (res.data) {
        await setCachedList(CA_CACHE_KEYS.COMPTES, res.data);
        await setCachedList(CA_CACHE_KEYS.PLAN_COMPTES, res.data);
    }
}

async function refreshJournauxCache(): Promise<void> {
    const res = await AccountingJournauxAnalytiquesService.getAllJournaux();
    if (res.data) await setCachedList(CA_CACHE_KEYS.JOURNAUX, res.data);
}

export const pushCaCentre = createCaCrudHandler<AxeAnalytiqueDto>({
    label: "centre d'analyse",
    createUrl: "/api/accounting/analytics",
    updateUrl: "/api/accounting/analytics/{id}",
    deleteUrl: "/api/accounting/analytics/{id}",
    refresh: refreshCentresCache,
});

export const pushCaCharge = createCaCrudHandler<ChargeAnalytiqueDto>({
    label: "charge analytique",
    createUrl: "/api/accounting/analytique/charges",
    updateUrl: "/api/accounting/analytique/charges/{id}",
    deleteUrl: "/api/accounting/analytique/charges/{id}",
    refresh: refreshChargesCache,
});

export const pushCaCompte = createCaCrudHandler<CompteAnalytiqueDto>({
    label: "compte analytique",
    createUrl: "/api/accounting/analytics/comptes",
    updateUrl: "/api/accounting/analytics/comptes/{id}",
    deleteUrl: "/api/accounting/analytics/comptes/{id}",
    refresh: refreshComptesCache,
});

export const pushCaJournal = createCaCrudHandler<JournalAnalytiqueDto>({
    label: "journal analytique",
    createUrl: "/api/accounting/analytique/journaux",
    updateUrl: "/api/accounting/analytique/journaux/{id}",
    deleteUrl: "/api/accounting/analytique/journaux/{id}",
    refresh: refreshJournauxCache,
});

/**
 * Plan de comptes analytiques : pas d'API dédiée — synchronisé via les comptes.
 */
export const pushCaPlanComptes = pushCaCompte;
