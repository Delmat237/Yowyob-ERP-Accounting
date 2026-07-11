"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import {
    getPeriodeComptableCourante,
    getPeriodesVisiblesUtilisateur,
} from "@/lib/accounting/periode-utilisateur";
import { fetchWithOfflineCache } from "@/lib/offline/fetch-with-cache";
import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { getCachedList } from "@/lib/offline/list-cache";
import { mergeListCacheWithOutbox } from "@/lib/offline/merge-list-cache";
import { networkStatus } from "@/lib/offline/network-status";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";
import { useOnPeriodesChanged } from "@/hooks/use-on-periodes-changed";

export function usePeriodeComptableVisible() {
    const [allPeriodes, setAllPeriodes] = useState<PeriodeComptableDto[]>([]);
    const [periode, setPeriode] = useState<PeriodeComptableDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingCache, setUsingCache] = useState(false);
    const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

    const tryLoadFromCache = useCallback(async (): Promise<boolean> => {
        const cached = await getCachedList<PeriodeComptableDto[]>(CG_CACHE_KEYS.PERIODES);
        if (!cached) return false;

        let data = cached.data;
        if (Array.isArray(data)) {
            data = (await mergeListCacheWithOutbox(
                CG_CACHE_KEYS.PERIODES,
                data as { id?: string }[],
            )) as PeriodeComptableDto[];
        }

        setAllPeriodes(data);
        setPeriode(getPeriodeComptableCourante(data));
        setUsingCache(true);
        setCacheTimestamp(cached.cachedAt);
        return true;
    }, []);

    const load = useCallback(async (options?: AutoRefreshOptions) => {
        const offline =
            typeof navigator !== "undefined" &&
            (!navigator.onLine || !networkStatus.isOnline());

        if (offline) {
            const hadCache = await tryLoadFromCache();
            if (!options?.silent) setLoading(false);
            if (hadCache) return;
        }

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
    }, [tryLoadFromCache]);

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
