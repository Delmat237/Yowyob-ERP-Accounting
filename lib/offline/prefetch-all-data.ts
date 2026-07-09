import { fetchWithOfflineCache } from "@/lib/offline/fetch-with-cache";
import { CG_CACHE_KEYS, CA_CACHE_KEYS, SETTINGS_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { hasCachedList, setCachedList } from "@/lib/offline/list-cache";
import { getStoredToken, isTokenValid } from "@/lib/auth-session";
import { AccountingEntriesService } from "@/src/lib2/services/AccountingEntriesService";
import { AccountingJournalManagementService } from "@/src/lib2/services/AccountingJournalManagementService";
import { AccountingPlanComptableService } from "@/src/lib2/services/AccountingPlanComptableService";
import { AccountingComptesService } from "@/src/lib2/services/AccountingComptesService";
import { AccountingOperationsService } from "@/src/lib2/services/AccountingOperationsService";
import { AccountingTaxManagementService } from "@/src/lib2/services/AccountingTaxManagementService";
import { CurrencyManagementService } from "@/src/lib2/services/CurrencyManagementService";
import { ExchangeRateManagementService } from "@/src/lib2/services/ExchangeRateManagementService";
import { AccountingBudgetsService } from "@/src/lib2/services/AccountingBudgetsService";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";
import { AccountingFiscalYearsService } from "@/src/lib2/services/AccountingFiscalYearsService";
import { AccountingAnalyticsService } from "@/src/lib2/services/AccountingAnalyticsService";
import { AccountingSettingService, type AccountingSettingDto } from "@/src/lib2/services/AccountingSettingService";
import { EmployeesRolesService } from "@/src/lib/services/EmployeesRolesService";
import { AgenciesService } from "@/src/lib/services/AgenciesService";
import { OrganizationsService } from "@/src/lib/services/OrganizationsService";
import { UsersService } from "@/src/lib/services/UsersService";
import { BusinessActorsService } from "@/src/lib/services/BusinessActorsService";
import { SystemAuditsService } from "@/src/lib/services/SystemAuditsService";
import { AccountingSubscriptionService } from "@/src/lib2/services/AccountingSubscriptionService";
import { getAnalytiqueConfig } from "@/lib/analytique/analytique-config-store";
import { initEcrituresAnalytiquesStore } from "@/lib/analytique/ecritures-analytiques-store";
import { listJournauxAnalytiques } from "@/lib/analytique/journaux-analytiques-store";
import {
    mockCentres,
    mockCharges,
    mockComptesAnalytiques,
    mockPlansAnalytiques,
} from "@/lib/analytique/mock-data";
import type { Devise } from "@/types/accounting";
import type { DeviseDto } from "@/src/lib2/models/DeviseDto";

const DATA_PREFETCH_KEY = "offline.data_prefetch_at";
/** Intervalle minimum entre deux pré-chargements complets (1 h). */
const PREFETCH_TTL_MS = 60 * 60 * 1000;
const SUBSCRIPTION_CACHE_KEY = "offline.cache.accounting_subscription";

const DEFAULT_SETTING_TYPES = ["FACTURE_FOURNISSEUR", "FACTURE_CLIENT", "MOUVEMENT_STOCK", "PAIEMENT"] as const;

function mergeAccountingSettings(data: AccountingSettingDto[]): AccountingSettingDto[] {
    return DEFAULT_SETTING_TYPES.map((type) => {
        const existing = data.find((s) => s.objetType === type);
        return (
            existing || {
                objetType: type,
                modeSaisie: "SEMI_AUTOMATIQUE" as const,
                actif: true,
            }
        );
    });
}

function mapDevises(
    currencies: DeviseDto[],
    rates: { devise_source_id?: string; devise_cible_id?: string; taux?: number }[],
): Devise[] {
    const nationalCurrency = currencies.find((c) => c.est_nationale);
    return currencies.map((c) => {
        const rateEntry = rates.find(
            (r) => r.devise_source_id === c.id && r.devise_cible_id === nationalCurrency?.id,
        );
        return {
            id: c.id!,
            name: c.nom,
            code: c.code,
            symbol: c.symbole || "",
            rate: rateEntry ? rateEntry.taux : c.est_nationale ? 1.0 : 0,
            estNationale: c.est_nationale,
            isActive: c.actif,
        };
    });
}

async function seedIfMissing<T>(cacheKey: string, data: T): Promise<void> {
    if (await hasCachedList(cacheKey)) return;
    await setCachedList(cacheKey, data);
}

function canPrefetchData(): boolean {
    if (typeof window === "undefined" || !navigator.onLine) return false;
    const token = getStoredToken();
    return isTokenValid(token) || Boolean(token);
}

function shouldRunPrefetch(force: boolean): boolean {
    if (force) return true;
    const last = localStorage.getItem(DATA_PREFETCH_KEY);
    if (!last) return true;
    const elapsed = Date.now() - Number(last);
    return Number.isNaN(elapsed) || elapsed > PREFETCH_TTL_MS;
}

/**
 * Pré-charge toutes les données API + mocks en IndexedDB pour navigation offline
 * sans visiter chaque page au préalable.
 */
export async function prefetchAllOfflineData(force = false): Promise<void> {
    if (!canPrefetchData() || !shouldRunPrefetch(force)) return;

    const orgId = localStorage.getItem("organization_id");

    const tasks: Promise<unknown>[] = [
        // Abonnement CG/CA — indispensable pour bascule offline.
        fetchWithOfflineCache({
            cacheKey: "settings.accounting_subscription",
            fetcher: async () => {
                const res = await AccountingSubscriptionService.getSubscription();
                const data = (res as { data?: { generale?: boolean; analytique?: boolean } })?.data;
                const generale = data?.generale ?? true;
                const analytique = data?.analytique ?? false;
                if (typeof window !== "undefined") {
                    localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify({ generale, analytique }));
                }
                return { generale, analytique };
            },
            emptyValue: { generale: true, analytique: false },
        }),
        // CG
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.ECRITURES,
            fetcher: () => AccountingEntriesService.getAll1(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.ECRITURES_NON_VALIDATED,
            fetcher: () => AccountingEntriesService.getNonValidated(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.JOURNAUX,
            fetcher: () => AccountingJournalManagementService.getAllJournals(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
            fetcher: () => AccountingPlanComptableService.getAllPlanComptables(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.COMPTES,
            fetcher: () => AccountingComptesService.getAllComptes(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.BUDGETS,
            fetcher: () => AccountingBudgetsService.getAllBudgets(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.AXES_ACTIFS,
            fetcher: () => AccountingAnalyticsService.getActiveAxes(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.PERIODES,
            fetcher: () => AccountingPeriodsService.getAllPeriodeComptables(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.EXERCICES,
            fetcher: () => AccountingFiscalYearsService.getAllExercices(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.OPERATIONS,
            fetcher: () => AccountingOperationsService.getAllOperationsComptables(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.TAXES,
            fetcher: () => AccountingTaxManagementService.getAllTaxes(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CG_CACHE_KEYS.DEVISES,
            fetcher: async () => {
                const [currenciesRes, ratesRes] = await Promise.all([
                    CurrencyManagementService.getAllDevises(),
                    ExchangeRateManagementService.getOrganizationRates(),
                ]);
                if (!currenciesRes.success || !currenciesRes.data) return [] as Devise[];
                const rates = ratesRes.success && ratesRes.data ? ratesRes.data : [];
                return mapDevises(currenciesRes.data, rates);
            },
            emptyValue: [] as Devise[],
        }),
        fetchWithOfflineCache({
            cacheKey: SETTINGS_CACHE_KEYS.ACCOUNTING,
            fetcher: async () => mergeAccountingSettings(await AccountingSettingService.getAllSettings()),
            emptyValue: mergeAccountingSettings([]),
        }),
        fetchWithOfflineCache({
            cacheKey: SETTINGS_CACHE_KEYS.ROLES,
            fetcher: () => EmployeesRolesService.getRoles(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: SETTINGS_CACHE_KEYS.AUDITS,
            fetcher: () => SystemAuditsService.getOrganizationActivity(100),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: SETTINGS_CACHE_KEYS.PROFILE_USER,
            fetcher: () => UsersService.getMe(),
            emptyValue: null,
        }),
        fetchWithOfflineCache({
            cacheKey: SETTINGS_CACHE_KEYS.BUSINESS_ACTOR,
            fetcher: () => BusinessActorsService.getMyProfile(),
            emptyValue: null,
        }),
        // CA API
        fetchWithOfflineCache({
            cacheKey: CA_CACHE_KEYS.AXES,
            fetcher: () => AccountingAnalyticsService.getAllAxes(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CA_CACHE_KEYS.BUDGETS,
            fetcher: () => AccountingBudgetsService.getAllBudgets(),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: CA_CACHE_KEYS.JOURNAUX,
            fetcher: async () => ({ success: true, data: listJournauxAnalytiques() }),
            emptyValue: [],
        }),
        // Mocks / stores locaux
        seedIfMissing(CA_CACHE_KEYS.CENTRES, mockCentres),
        seedIfMissing(CA_CACHE_KEYS.CHARGES, mockCharges),
        seedIfMissing(CA_CACHE_KEYS.COMPTES, mockComptesAnalytiques),
        seedIfMissing(CA_CACHE_KEYS.PLAN_COMPTES, mockPlansAnalytiques),
        seedIfMissing(CA_CACHE_KEYS.CONFIG, getAnalytiqueConfig()),
        initEcrituresAnalytiquesStore(),
    ];

    if (orgId) {
        tasks.push(
            fetchWithOfflineCache({
                cacheKey: SETTINGS_CACHE_KEYS.organization(orgId),
                fetcher: () => OrganizationsService.getOrganizationById(orgId),
                emptyValue: null,
            }),
            fetchWithOfflineCache({
                cacheKey: SETTINGS_CACHE_KEYS.employees(orgId),
                fetcher: () => EmployeesRolesService.getEmployees(orgId),
                emptyValue: [],
            }),
            fetchWithOfflineCache({
                cacheKey: SETTINGS_CACHE_KEYS.agencies(orgId),
                fetcher: () => AgenciesService.getAgencies(orgId),
                emptyValue: [],
            }),
        );
    }

    // Profil acteur — best effort (404 possible)
    tasks.push(
        fetchWithOfflineCache({
            cacheKey: SETTINGS_CACHE_KEYS.PROFILE_ACTOR,
            fetcher: () => BusinessActorsService.getMyProfile(),
            emptyValue: null,
        }).catch(() => undefined),
    );

    await Promise.allSettled(tasks);
    localStorage.setItem(DATA_PREFETCH_KEY, String(Date.now()));
}

export function resetDataPrefetchFlag(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(DATA_PREFETCH_KEY);
}
