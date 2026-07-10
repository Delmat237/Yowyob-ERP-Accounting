import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { setCachedList } from "@/lib/offline/list-cache";
import { getIdMapping, isOfflineClientId, resolveServerId, setIdMapping } from "@/lib/offline/id-map";
import { syncRequest } from "@/lib/offline/sync-request";
import type { OutboxOperation } from "@/lib/offline/types";
import type { OperationComptableDto } from "@/src/lib2/models/OperationComptableDto";
import type { TaxeDto } from "@/src/lib2/models/TaxeDto";
import type { DeviseDto } from "@/src/lib2/models/DeviseDto";
import type { JournalComptableDto } from "@/src/lib2/models/JournalComptableDto";
import type { PlanComptableDto } from "@/src/lib2/models/PlanComptableDto";
import type { ExerciceComptableDto } from "@/src/lib2/models/ExerciceComptableDto";
import type { BudgetDto } from "@/src/lib2/models/BudgetDto";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import { AccountingOperationsService } from "@/src/lib2/services/AccountingOperationsService";
import { AccountingTaxManagementService } from "@/src/lib2/services/AccountingTaxManagementService";
import { CurrencyManagementService } from "@/src/lib2/services/CurrencyManagementService";
import { AccountingJournalManagementService } from "@/src/lib2/services/AccountingJournalManagementService";
import { AccountingPlanComptableService } from "@/src/lib2/services/AccountingPlanComptableService";
import { AccountingFiscalYearsService } from "@/src/lib2/services/AccountingFiscalYearsService";
import { AccountingBudgetsService } from "@/src/lib2/services/AccountingBudgetsService";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";

function stripLocalId<T extends { id?: string }>(body: T): T {
    if (!body.id || isOfflineClientId(body.id)) {
        const { id: _removed, ...rest } = body;
        return rest as T;
    }
    return body;
}

function assertSuccess(response: { success?: boolean; message?: string } | null | undefined, label: string) {
    if (response?.success === false) {
        throw new Error(response.message ?? `Échec ${label}`);
    }
}

type ApiResponse = { success?: boolean; message?: string; data?: { id?: string } };

function createCgCrudHandler<T extends { id?: string }>(config: {
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

async function refreshOperationsCache(): Promise<void> {
    const res = await AccountingOperationsService.getAllOperationsComptables();
    if (res.data) await setCachedList(CG_CACHE_KEYS.OPERATIONS, res.data);
}

async function refreshTaxesCache(): Promise<void> {
    const res = await AccountingTaxManagementService.getAllTaxes();
    if (res.data) await setCachedList(CG_CACHE_KEYS.TAXES, res.data);
}

async function refreshDevisesCache(): Promise<void> {
    const res = await CurrencyManagementService.getAllDevises();
    if (res.data) await setCachedList(CG_CACHE_KEYS.DEVISES, res.data);
}

async function refreshJournalsCache(): Promise<void> {
    const res = await AccountingJournalManagementService.getAllJournals();
    if (res.data) await setCachedList(CG_CACHE_KEYS.JOURNAUX, res.data);
}

async function refreshPlanComptableCache(): Promise<void> {
    const res = await AccountingPlanComptableService.getAllPlanComptables();
    if (res.data) await setCachedList(CG_CACHE_KEYS.PLAN_COMPTABLE, res.data);
}

async function refreshExercicesCache(): Promise<void> {
    const res = await AccountingFiscalYearsService.getAllExercices();
    if (res.data) await setCachedList(CG_CACHE_KEYS.EXERCICES, res.data);
}

async function refreshBudgetsCache(): Promise<void> {
    const res = await AccountingBudgetsService.getAllBudgets();
    if (res.data) await setCachedList(CG_CACHE_KEYS.BUDGETS, res.data);
}

async function refreshPeriodesCache(): Promise<void> {
    const res = await AccountingPeriodsService.getAllPeriodeComptables();
    if (res.data) await setCachedList(CG_CACHE_KEYS.PERIODES, res.data);
}

export const pushCgJournal = createCgCrudHandler<JournalComptableDto>({
    label: "journal",
    createUrl: "/api/accounting/journals",
    updateUrl: "/api/accounting/journals/{id}",
    deleteUrl: "/api/accounting/journals/{id}",
    refresh: refreshJournalsCache,
});

export const pushCgPlanComptable = createCgCrudHandler<PlanComptableDto>({
    label: "compte",
    createUrl: "/api/accounting/plan-comptable",
    updateUrl: "/api/accounting/plan-comptable/{id}",
    deleteUrl: "/api/accounting/plan-comptable/{id}",
    refresh: refreshPlanComptableCache,
});

export const pushCgExercice = createCgCrudHandler<ExerciceComptableDto>({
    label: "exercice",
    createUrl: "/api/accounting/exercices",
    updateUrl: "/api/accounting/exercices/{id}",
    refresh: refreshExercicesCache,
});

export const pushCgBudget = createCgCrudHandler<BudgetDto>({
    label: "budget",
    createUrl: "/api/accounting/budgets",
    updateUrl: "/api/accounting/budgets/{id}",
    deleteUrl: "/api/accounting/budgets/{id}",
    refresh: refreshBudgetsCache,
});

export const pushCgPeriode = createCgCrudHandler<PeriodeComptableDto>({
    label: "période",
    createUrl: "/api/accounting/periodes",
    updateUrl: "/api/accounting/periodes/{id}",
    refresh: refreshPeriodesCache,
});

export async function pushCgOperation(op: OutboxOperation): Promise<void> {
    const payload = op.payload as OperationComptableDto;
    const serverId = await resolveServerId(op.entityId);

    switch (op.action) {
        case "CREATE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "POST",
                    url: "/api/accounting/operations",
                    body: stripLocalId(payload),
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            assertSuccess(res, "création opération");
            if (res.data?.id && (await getIdMapping(op.entityId)) == null) {
                await setIdMapping(op.entityId, res.data.id);
            }
            break;
        }
        case "UPDATE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "PUT",
                    url: "/api/accounting/operations/{id}",
                    path: { id: serverId },
                    body: { ...payload, id: serverId },
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            assertSuccess(res, "mise à jour opération");
            break;
        }
        case "DELETE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "DELETE",
                    url: "/api/accounting/operations/{id}",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            assertSuccess(res, "suppression opération");
            break;
        }
        default:
            throw new Error(`Action non supportée : ${op.action}`);
    }

    await refreshOperationsCache();
}

export async function pushCgTaxe(op: OutboxOperation): Promise<void> {
    const payload = op.payload as TaxeDto;
    const serverId = await resolveServerId(op.entityId);

    switch (op.action) {
        case "CREATE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "POST",
                    url: "/api/accounting/taxes",
                    body: stripLocalId(payload),
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            assertSuccess(res, "création taxe");
            if (res.data?.id) await setIdMapping(op.entityId, res.data.id);
            break;
        }
        case "UPDATE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "PUT",
                    url: "/api/accounting/taxes/{id}",
                    path: { id: serverId },
                    body: { ...payload, id: serverId },
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            assertSuccess(res, "mise à jour taxe");
            break;
        }
        case "DELETE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "DELETE",
                    url: "/api/accounting/taxes/{id}",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            assertSuccess(res, "suppression taxe");
            break;
        }
        default:
            throw new Error(`Action non supportée : ${op.action}`);
    }

    await refreshTaxesCache();
}

export async function pushCgDevise(op: OutboxOperation): Promise<void> {
    const payload = op.payload as DeviseDto;
    const serverId = await resolveServerId(op.entityId);

    switch (op.action) {
        case "CREATE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "POST",
                    url: "/api/accounting/currencies",
                    body: stripLocalId(payload),
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            assertSuccess(res, "création devise");
            if (res.data?.id) await setIdMapping(op.entityId, res.data.id);
            break;
        }
        case "UPDATE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "PUT",
                    url: "/api/accounting/currencies/{id}",
                    path: { id: serverId },
                    body: { ...payload, id: serverId },
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            assertSuccess(res, "mise à jour devise");
            break;
        }
        case "DELETE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "DELETE",
                    url: "/api/accounting/currencies/{id}",
                    path: { id: serverId },
                },
                op.clientMutationId,
            );
            assertSuccess(res, "suppression devise");
            break;
        }
        default:
            throw new Error(`Action non supportée : ${op.action}`);
    }

    await refreshDevisesCache();
}

export async function pushCgDeviseRate(op: OutboxOperation): Promise<void> {
    const payload = op.payload as {
        sourceId?: string;
        targetId?: string;
        rate?: number;
        devise_source_id?: string;
        devise_cible_id?: string;
        taux?: number;
    };

    switch (op.action) {
        case "CREATE":
        case "UPDATE": {
            const res = await syncRequest<ApiResponse>(
                {
                    method: "POST",
                    url: "/api/accounting/exchange-rates",
                    body: {
                        devise_source_id: payload.devise_source_id ?? payload.sourceId!,
                        devise_cible_id: payload.devise_cible_id ?? payload.targetId!,
                        taux: payload.taux ?? payload.rate!,
                        date_effet: new Date().toISOString(),
                    },
                    mediaType: "application/json",
                },
                op.clientMutationId,
            );
            assertSuccess(res, "taux de change");
            break;
        }
        default:
            throw new Error(`Action non supportée : ${op.action}`);
    }
}
