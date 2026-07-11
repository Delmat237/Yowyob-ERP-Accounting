"use client";

import { useCallback, useEffect, useState } from "react";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import { fetchWithOfflineCache, readCachedList } from "@/lib/offline/fetch-with-cache";
import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { isClientOffline } from "@/lib/offline/network-status";
import type { JournalComptableDto } from "@/src/lib2/models/JournalComptableDto";
import { AccountingJournalManagementService } from "@/src/lib2/services/AccountingJournalManagementService";

export function useJournauxComptables() {
    const [journaux, setJournaux] = useState<JournalComptableDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [usingCache, setUsingCache] = useState(false);
    const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

    const tryLoadFromCache = useCallback(async (): Promise<boolean> => {
        const result = await readCachedList<JournalComptableDto[]>(
            CG_CACHE_KEYS.JOURNAUX,
            [],
        );
        if (!result.cachedAt) return false;

        setJournaux(result.data);
        setUsingCache(true);
        setCacheTimestamp(result.cachedAt);
        return true;
    }, []);

    const load = useCallback(async (options?: AutoRefreshOptions) => {
        if (isClientOffline()) {
            const hadCache = await tryLoadFromCache();
            if (!options?.silent) setLoading(false);
            if (hadCache) return;
        }

        if (!options?.silent) setLoading(true);
        try {
            const result = await fetchWithOfflineCache({
                cacheKey: CG_CACHE_KEYS.JOURNAUX,
                fetcher: () => AccountingJournalManagementService.getAllJournals(),
                emptyValue: [] as JournalComptableDto[],
            });
            setJournaux(result.data);
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

    return {
        journaux,
        loading,
        usingCache,
        cacheTimestamp,
        refresh: load,
    };
}
