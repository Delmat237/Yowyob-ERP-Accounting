"use client";

import { useCallback, useEffect, useState } from "react";
import { loadOfflineList, persistOfflineList } from "@/lib/offline/ca-offline-list";
import { getCachedList } from "@/lib/offline/list-cache";

/**
 * Liste locale / mock avec persistance IndexedDB pour relecture offline.
 */
export function useOfflineMockList<T>(cacheKey: string, fallback: T) {
    const [data, setDataState] = useState<T>(fallback);
    const [usingCache, setUsingCache] = useState(false);
    const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    const reload = useCallback(async () => {
        setIsLoading(true);
        const result = await loadOfflineList({
            cacheKey,
            loader: async () => {
                const cached = await getCachedList<T>(cacheKey);
                return cached?.data ?? fallback;
            },
            fallback,
        });
        setDataState(result.data);
        setUsingCache(result.fromCache);
        setCacheTimestamp(result.cachedAt);
        setIsLoading(false);
    }, [cacheKey, fallback]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const setData = useCallback(
        async (updater: T | ((prev: T) => T)) => {
            setDataState((prev) => {
                const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
                void persistOfflineList(cacheKey, next);
                return next;
            });
        },
        [cacheKey],
    );

    return { data, setData, usingCache, cacheTimestamp, isLoading, reload };
}
