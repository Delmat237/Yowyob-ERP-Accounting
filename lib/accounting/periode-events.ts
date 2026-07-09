import {
    getPeriodeComptableCourante,
    getPeriodesVisiblesUtilisateur,
} from "@/lib/accounting/periode-utilisateur";
import { loadDashboardSnapshot, saveDashboardSnapshot } from "@/lib/offline/dashboard-cache";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";

export type PeriodeChangeEvent = {
    periodes: PeriodeComptableDto[];
    nextPeriode: PeriodeComptableDto | null;
};

type PeriodeChangeListener = (event: PeriodeChangeEvent) => void;

const listeners = new Set<PeriodeChangeListener>();

export function buildPeriodeChangeEvent(
    periodes: PeriodeComptableDto[],
): PeriodeChangeEvent {
    return {
        periodes,
        nextPeriode: getPeriodeComptableCourante(periodes),
    };
}

/** Notifie tous les abonnés (dashboards CG/CA, Analyse, etc.) d'un changement de période. */
export function notifyPeriodesChanged(event: PeriodeChangeEvent): void {
    listeners.forEach((listener) => {
        try {
            listener(event);
        } catch (error) {
            console.error("[periode-events] listener error:", error);
        }
    });
}

export function subscribePeriodesChanged(listener: PeriodeChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Met à jour les snapshots offline pour refléter immédiatement la nouvelle période visible. */
export async function syncOfflineCachesAfterPeriodeChange(
    event: PeriodeChangeEvent,
): Promise<void> {
    const snap = await loadDashboardSnapshot();
    if (snap) {
        await saveDashboardSnapshot({
            kpis: snap.kpis,
            ratios: snap.ratios,
            systemHealth: snap.systemHealth,
            journalActivity: snap.journalActivity,
            balanceLines: snap.balanceLines,
            cashFlowData: snap.cashFlowData,
            recentOps: snap.recentOps,
            incomeVsExpense: snap.incomeVsExpense,
            periodsList: getPeriodesVisiblesUtilisateur(event.periodes),
            activePeriodCode: event.nextPeriode?.code ?? snap.activePeriodCode,
            hasNoPeriods: !event.nextPeriode,
        });
    }
}
