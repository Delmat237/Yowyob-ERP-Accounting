import {
    getPeriodeComptableCourante,
    parsePeriodeDateValue,
} from "@/lib/accounting/periode-utilisateur";
import { ANALYSE_CACHE_KEYS, CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { fetchWithOfflineCache } from "@/lib/offline/fetch-with-cache";
import { getCachedList } from "@/lib/offline/list-cache";
import { formatDateForApi } from "@/lib/utils";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import { AccountingAuditService } from "@/src/lib2/services/AccountingAuditService";
import { AccountingFinancialReportsService } from "@/src/lib2/services/AccountingFinancialReportsService";

async function getCurrentPeriode(): Promise<PeriodeComptableDto | null> {
    const cached = await getCachedList<PeriodeComptableDto[]>(CG_CACHE_KEYS.PERIODES);
    const periodes = cached?.data ?? [];
    return getPeriodeComptableCourante(periodes);
}

/**
 * Pré-charge les rapports de l'onglet Analyse pour la période courante (IndexedDB).
 */
export async function prefetchAnalyseReportsForCurrentPeriode(): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine) return;

    const periode = await getCurrentPeriode();
    if (!periode?.id) return;

    const dateDebut =
        parsePeriodeDateValue(periode.dateDebut) ??
        parsePeriodeDateValue((periode as Record<string, unknown>).date_debut);
    const dateFin =
        parsePeriodeDateValue(periode.dateFin) ??
        parsePeriodeDateValue((periode as Record<string, unknown>).date_fin);
    if (!dateDebut || !dateFin) return;

    const periodeId = periode.id;
    const start = formatDateForApi(dateDebut);
    const end = formatDateForApi(dateFin);
    const tenantId = localStorage.getItem("organization_id") || "";

    await Promise.allSettled([
        fetchWithOfflineCache({
            cacheKey: ANALYSE_CACHE_KEYS.bilan(periodeId),
            fetcher: () => AccountingFinancialReportsService.generateBilan(start, end),
            emptyValue: null,
        }),
        fetchWithOfflineCache({
            cacheKey: ANALYSE_CACHE_KEYS.compteResultat(periodeId),
            fetcher: () => AccountingFinancialReportsService.generateCompteResultat(start, end),
            emptyValue: null,
        }),
        fetchWithOfflineCache({
            cacheKey: ANALYSE_CACHE_KEYS.cashFlow(periodeId),
            fetcher: () => AccountingFinancialReportsService.generateCashFlow(start, end),
            emptyValue: null,
        }),
        fetchWithOfflineCache({
            cacheKey: ANALYSE_CACHE_KEYS.executiveSummary(periodeId),
            fetcher: () => AccountingFinancialReportsService.generateExecutiveSummary(start, end),
            emptyValue: null,
        }),
        fetchWithOfflineCache({
            cacheKey: ANALYSE_CACHE_KEYS.grandLivre(periodeId),
            fetcher: () => AccountingFinancialReportsService.generateGrandLivre(start, end),
            emptyValue: [],
        }),
        fetchWithOfflineCache({
            cacheKey: ANALYSE_CACHE_KEYS.balance(periodeId),
            fetcher: () => AccountingFinancialReportsService.generateBalance(start, end),
            emptyValue: null,
        }),
        fetchWithOfflineCache({
            cacheKey: ANALYSE_CACHE_KEYS.audits(periodeId),
            fetcher: async () => {
                const response = dateDebut && dateFin
                    ? await AccountingAuditService.getByPeriode(tenantId, dateDebut, dateFin)
                    : await AccountingAuditService.getAllByOrganization(tenantId, 100);
                const audits = response.data || [];
                return {
                    success: true,
                    data: audits.map((a) => ({
                        id: a.id || "",
                        user: a.utilisateur || "Système",
                        action: a.action || "INCONNU",
                        date: a.dateAction || a.createdAt || "",
                        description: a.details || "Aucune description",
                        details: a.details || "",
                        adresseIp: a.adresseIp || "N/A",
                        donneesAvant: a.donneesAvant,
                        donneesApres: a.donneesApres,
                    })),
                };
            },
            emptyValue: [],
        }),
    ]);
}
