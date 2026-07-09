import { idbGet, idbPut } from "@/lib/offline/idb";
import type { MetaEntry } from "@/lib/offline/types";

const DASHBOARD_SNAPSHOT_KEY = "snapshot.cg.dashboard";

export type DashboardSnapshot = {
    kpis: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        totalDebit: number;
        totalCredit: number;
        pendingEntries: number;
        totalEntries: number;
    };
    ratios: {
        liquidityRatio: number;
        debtRatio: number;
        netMargin: number;
    };
    systemHealth: {
        isBalanced: boolean;
        lastCheck: string;
        alerts: number;
    };
    journalActivity: Array<{ name: string; code: string; count: number; color: string }>;
    balanceLines: Array<{
        compte: string;
        libelle: string;
        debit: number;
        credit: number;
        solde: number;
    }>;
    cashFlowData: Array<{ name: string; value: number }>;
    recentOps: Array<{
        id?: string;
        libelle: string;
        journal: string;
        debit: number;
        credit: number;
        date: string;
        status: string;
    }>;
    incomeVsExpense: Array<Record<string, string | number>>;
    periodsList: unknown[];
    activePeriodCode: string;
    hasNoPeriods: boolean;
    cachedAt: string;
};

export async function saveDashboardSnapshot(
    data: Omit<DashboardSnapshot, "cachedAt">,
): Promise<void> {
    const entry: MetaEntry = {
        key: DASHBOARD_SNAPSHOT_KEY,
        value: { ...data, cachedAt: new Date().toISOString() } satisfies DashboardSnapshot,
    };
    await idbPut("meta", entry);
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot | null> {
    const entry = await idbGet<MetaEntry>("meta", DASHBOARD_SNAPSHOT_KEY);
    if (!entry?.value || typeof entry.value !== "object") return null;
    return entry.value as DashboardSnapshot;
}
