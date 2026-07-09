"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import {
    getPeriodeComptableCourante,
    getPeriodesVisiblesUtilisateur,
} from "@/lib/accounting/periode-utilisateur";
import { fetchWithOfflineCache } from "@/lib/offline/fetch-with-cache";
import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";
import { useOnPeriodesChanged } from "@/hooks/use-on-periodes-changed";

export function usePeriodeComptableVisible() {
    const [allPeriodes, setAllPeriodes] = useState<PeriodeComptableDto[]>([]);
    const [periode, setPeriode] = useState<PeriodeComptableDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingCache, setUsingCache] = useState(false);
    const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

    const load = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) setLoading(true);
        try {
            const result = await fetchWithOfflineCache({
                cacheKey: CG_CACHE_KEYS.PERIODES,
                fetcher: () => AccountingPeriodsService.getAllPeriodeComptables(),
                emptyValue: [] as PeriodeComptableDto[],
            });
            setAllPeriodes(result.data);
            setPeriode(getPeriodeComptableCourante(result.data));
            setUsingCache(result.fromCache);
            setCacheTimestamp(result.cachedAt);
        } finally {
            if (!options?.silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useAutoRefresh(load, [load]);

    useOnPeriodesChanged((event) => {
        setAllPeriodes(event.periodes);
        setPeriode(event.nextPeriode);
    });

    const periodesVisibles = useMemo(
        () => getPeriodesVisiblesUtilisateur(allPeriodes),
        [allPeriodes],
    );

    return {
        periode,
        periodeId: periode?.id ?? null,
        periodesVisibles,
        allPeriodes,
        loading,
        usingCache,
        cacheTimestamp,
        refresh: load,
    };
}
