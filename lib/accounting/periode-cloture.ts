import {
    advancePeriodsAfterClose,
    getPeriodeComptableCourante,
} from "@/lib/accounting/periode-utilisateur";
import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { getCachedList, setCachedList } from "@/lib/offline/list-cache";
import { networkStatus } from "@/lib/offline/network-status";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";
import {
    buildPeriodeChangeEvent,
    notifyPeriodesChanged,
    syncOfflineCachesAfterPeriodeChange,
} from "@/lib/accounting/periode-events";

export type ClosePeriodeResult = {
    periodes: PeriodeComptableDto[];
    nextPeriode: PeriodeComptableDto | null;
};

/**
 * Clôture une période et affiche immédiatement la suivante :
 * - API close (si en ligne)
 * - mise à jour optimiste du cache IndexedDB
 * - ouverture de la période suivante si plus aucune n'est ouverte
 */
export async function closePeriodeComptableAndAdvance(
    closedId: string,
    currentPeriodes?: PeriodeComptableDto[],
): Promise<ClosePeriodeResult> {
    const cached = await getCachedList<PeriodeComptableDto[]>(CG_CACHE_KEYS.PERIODES);
    let periodes = currentPeriodes ?? cached?.data ?? [];

    if (networkStatus.isOnline()) {
        await AccountingPeriodsService.closePeriodeComptable(closedId);
    }

    let updated = advancePeriodsAfterClose(periodes, closedId);

    const openedNext = updated.find(
        (p) => !p.cloturee && periodes.find((b) => b.id === p.id)?.cloturee,
    );
    if (openedNext?.id && networkStatus.isOnline()) {
        try {
            await AccountingPeriodsService.updatePeriodeComptable(openedNext.id, openedNext);
        } catch {
            // Le backend peut déjà ouvrir la période suivante automatiquement.
        }
    }

    await setCachedList(CG_CACHE_KEYS.PERIODES, updated);

    if (networkStatus.isOnline()) {
        try {
            const res = await AccountingPeriodsService.getAllPeriodeComptables();
            if (res.success && Array.isArray(res.data)) {
                periodes = res.data;
                if (!periodes.some((p) => !p.cloturee)) {
                    periodes = advancePeriodsAfterClose(periodes, closedId);
                    const toOpen = getPeriodeComptableCourante(periodes);
                    if (toOpen?.id && toOpen.id !== closedId && !toOpen.cloturee) {
                        try {
                            await AccountingPeriodsService.updatePeriodeComptable(toOpen.id, toOpen);
                        } catch {
                            /* ignore */
                        }
                    }
                }
                updated = periodes;
                await setCachedList(CG_CACHE_KEYS.PERIODES, updated);
            }
        } catch {
            /* conserver la version optimiste */
        }
    }

    const result = {
        periodes: updated,
        nextPeriode: getPeriodeComptableCourante(updated),
    };

    const changeEvent = buildPeriodeChangeEvent(result.periodes);
    await syncOfflineCachesAfterPeriodeChange(changeEvent);
    notifyPeriodesChanged(changeEvent);

    return result;
}
