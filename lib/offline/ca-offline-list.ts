import {
    fetchWithOfflineCache,
    type OfflineFetchResult,
} from "@/lib/offline/fetch-with-cache";
import { setCachedList } from "@/lib/offline/list-cache";

/**
 * Charge une liste depuis l'API / source locale en ligne, ou depuis IndexedDB hors ligne.
 */
export async function loadOfflineList<T>({
    cacheKey,
    loader,
    fallback,
}: {
    cacheKey: string;
    loader: () => T | Promise<T>;
    fallback: T;
}): Promise<OfflineFetchResult<T>> {
    return fetchWithOfflineCache({
        cacheKey,
        fetcher: async () => {
            const data = await loader();
            return { success: true, data };
        },
        emptyValue: fallback,
    });
}

/** Persiste une liste modifiée localement pour relecture offline. */
export async function persistOfflineList<T>(cacheKey: string, data: T): Promise<void> {
    await setCachedList(cacheKey, data);
}
