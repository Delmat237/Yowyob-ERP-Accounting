import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { setCachedList } from "@/lib/offline/list-cache";
import { getIdMapping, resolveServerId, setIdMapping } from "@/lib/offline/id-map";
import type { OutboxOperation } from "@/lib/offline/types";
import { AccountingOperationsService } from "@/src/lib2/services/AccountingOperationsService";
import { AccountingTaxManagementService } from "@/src/lib2/services/AccountingTaxManagementService";
import { CurrencyManagementService } from "@/src/lib2/services/CurrencyManagementService";
import { ExchangeRateManagementService } from "@/src/lib2/services/ExchangeRateManagementService";
import type { OperationComptableDto } from "@/src/lib2/models/OperationComptableDto";
import type { TaxeDto } from "@/src/lib2/models/TaxeDto";
import type { DeviseDto } from "@/src/lib2/models/DeviseDto";
import type { JournalComptableDto } from "@/src/lib2/models/JournalComptableDto";
import type { PlanComptableDto } from "@/src/lib2/models/PlanComptableDto";
import type { ExerciceComptableDto } from "@/src/lib2/models/ExerciceComptableDto";
import type { BudgetDto } from "@/src/lib2/models/BudgetDto";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import { AccountingJournalManagementService } from "@/src/lib2/services/AccountingJournalManagementService";
import { AccountingPlanComptableService } from "@/src/lib2/services/AccountingPlanComptableService";
import { AccountingFiscalYearsService } from "@/src/lib2/services/AccountingFiscalYearsService";
import { AccountingBudgetsService } from "@/src/lib2/services/AccountingBudgetsService";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";
import { isOfflineClientId } from "@/lib/offline/id-map";

function isLocalId(id?: string): boolean {
    if (!id) return true;
    return isOfflineClientId(id);
}

function stripLocalId<T extends { id?: string }>(body: T): T {
    if (!body.id || isLocalId(body.id)) {
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

async function refreshOperationsCache(): Promise<void> {
    const res = await AccountingOperationsService.getAllOperationsComptables();
    if (res.data) await setCachedList(CG_CACHE_KEYS.OPERATIONS, res.data);
}

async function refreshTaxesCache(): Promise<void> {
    const res = await AccountingTaxManagementService.getAllTaxes();
    if (res.data) await setCachedList(CG_CACHE_KEYS.TAXES, res.data);
}

type ApiResponse = { success?: boolean; message?: string; data?: { id?: string } };

function createCgCrudHandler<T extends { id?: string }>(config: {
    cacheKey: string;
    label: string;
    create: (body: T) => Promise<ApiResponse>;
    update: (id: string, body: T) => Promise<ApiResponse>;
    delete?: (id: string) => Promise<ApiResponse>;
    refresh: () => Promise<void>;
}): (op: OutboxOperation) => Promise<void> {
    return async (op: OutboxOperation) => {
        const payload = op.payload as T;
        const serverId = await resolveServerId(op.entityId);

        switch (op.action) {
            case "CREATE": {
                const res = await config.create(stripLocalId(payload));
                assertSuccess(res, `création ${config.label}`);
                if (res.data?.id) await setIdMapping(op.entityId, res.data.id);
                break;
            }
            case "UPDATE": {
                const res = await config.update(serverId, { ...payload, id: serverId } as T);
                assertSuccess(res, `mise à jour ${config.label}`);
                break;
            }
            case "DELETE": {
                if (!config.delete) throw new Error(`Suppression non supportée : ${config.label}`);
                const res = await config.delete(serverId);
                assertSuccess(res, `suppression ${config.label}`);
                break;
            }
            default:
                throw new Error(`Action non supportée : ${op.action}`);
        }

        await config.refresh();
    };
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
    cacheKey: CG_CACHE_KEYS.JOURNAUX,
    label: "journal",
    create: (body) => AccountingJournalManagementService.createJournal(body),
    update: (id, body) => AccountingJournalManagementService.updateJournal(id, body),
    delete: (id) => AccountingJournalManagementService.deleteJournal(id),
    refresh: refreshJournalsCache,
});

export const pushCgPlanComptable = createCgCrudHandler<PlanComptableDto>({
    cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
    label: "compte",
    create: (body) => AccountingPlanComptableService.createPlanComptable(body) as Promise<ApiResponse>,
    update: (id, body) => AccountingPlanComptableService.updatePlanComptable(id, body),
    delete: (id) => AccountingPlanComptableService.deactivatePlanComptable(id),
    refresh: refreshPlanComptableCache,
});

export const pushCgExercice = createCgCrudHandler<ExerciceComptableDto>({
    cacheKey: CG_CACHE_KEYS.EXERCICES,
    label: "exercice",
    create: (body) => AccountingFiscalYearsService.createExercice(body),
    update: (id, body) => AccountingFiscalYearsService.updateExercice(id, body),
    refresh: refreshExercicesCache,
});

export const pushCgBudget = createCgCrudHandler<BudgetDto>({
    cacheKey: CG_CACHE_KEYS.BUDGETS,
    label: "budget",
    create: (body) => AccountingBudgetsService.createBudget(body),
    update: (id, body) => AccountingBudgetsService.updateBudget(id, body),
    delete: (id) => AccountingBudgetsService.deleteBudget(id),
    refresh: refreshBudgetsCache,
});

export const pushCgPeriode = createCgCrudHandler<PeriodeComptableDto>({
    cacheKey: CG_CACHE_KEYS.PERIODES,
    label: "période",
    create: (body) => AccountingPeriodsService.createPeriodeComptable(body) as Promise<ApiResponse>,
    update: (id, body) => AccountingPeriodsService.updatePeriodeComptable(id, body),
    refresh: refreshPeriodesCache,
});

export async function pushCgOperation(op: OutboxOperation): Promise<void> {
    const payload = op.payload as OperationComptableDto;
    const serverId = await resolveServerId(op.entityId);

    switch (op.action) {
        case "CREATE": {
            const res = await AccountingOperationsService.createOperationComptable(stripLocalId(payload));
            assertSuccess(res, "création opération");
            if (res.data?.id && (await getIdMapping(op.entityId)) == null) {
                await setIdMapping(op.entityId, res.data.id);
            }
            break;
        }
        case "UPDATE": {
            const res = await AccountingOperationsService.updateOperationComptable(
                serverId,
                { ...payload, id: serverId },
            );
            assertSuccess(res, "mise à jour opération");
            break;
        }
        case "DELETE": {
            const res = await AccountingOperationsService.deleteOperationComptable(serverId);
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
            const res = await AccountingTaxManagementService.createTaxe(stripLocalId(payload));
            assertSuccess(res, "création taxe");
            if (res.data?.id) await setIdMapping(op.entityId, res.data.id);
            break;
        }
        case "UPDATE": {
            const res = await AccountingTaxManagementService.updateTaxe(serverId, {
                ...payload,
                id: serverId,
            });
            assertSuccess(res, "mise à jour taxe");
            break;
        }
        case "DELETE": {
            const res = await AccountingTaxManagementService.deleteTaxe(serverId);
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
            const res = await CurrencyManagementService.createDevise(stripLocalId(payload));
            assertSuccess(res, "création devise");
            if (res.data?.id) await setIdMapping(op.entityId, res.data.id);
            break;
        }
        case "UPDATE": {
            const res = await CurrencyManagementService.updateDevise(serverId, {
                ...payload,
                id: serverId,
            });
            assertSuccess(res, "mise à jour devise");
            break;
        }
        case "DELETE": {
            const res = await CurrencyManagementService.deleteDevise(serverId);
            assertSuccess(res, "suppression devise");
            break;
        }
        default:
            throw new Error(`Action non supportée : ${op.action}`);
    }
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
            const res = await ExchangeRateManagementService.createTauxChange({
                devise_source_id: payload.devise_source_id ?? payload.sourceId!,
                devise_cible_id: payload.devise_cible_id ?? payload.targetId!,
                taux: payload.taux ?? payload.rate!,
                date_effet: new Date().toISOString(),
            });
            assertSuccess(res, "taux de change");
            break;
        }
        default:
            throw new Error(`Action non supportée : ${op.action}`);
    }
}
