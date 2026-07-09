import { getCachedList, setCachedList } from "@/lib/offline/list-cache";
import { isNetworkError, networkStatus } from "@/lib/offline/network-status";
import { mergeListCacheWithOutbox } from "@/lib/offline/merge-list-cache";

export type OfflineFetchResult<T> = {
    data: T;
    fromCache: boolean;
    cachedAt?: string;
};

type ApiLike = {
    success?: boolean;
    message?: string;
    data?: unknown;
};

function isApiFailure(response: unknown): boolean {
    if (response == null) return true;
    if (typeof response === "object" && "success" in response) {
        return (response as ApiLike).success === false;
    }
    return false;
}

function extractData<T>(response: unknown): T | null {
    if (response != null && typeof response === "object" && "data" in response) {
        return ((response as ApiLike).data as T) ?? null;
    }
    return response as T;
}

/**
 * Online-first : appelle le backend si en ligne, met en cache en cas de succès.
 * Hors ligne ou échec réseau : retourne la dernière liste connue depuis IndexedDB.
 */
export async function fetchWithOfflineCache<T>({
    cacheKey,
    fetcher,
    emptyValue,
}: {
    cacheKey: string;
    fetcher: () => Promise<unknown>;
    emptyValue: T;
}): Promise<OfflineFetchResult<T>> {
    const tryCache = async (): Promise<OfflineFetchResult<T>> => {
        const cached = await getCachedList<T>(cacheKey);
        if (cached) {
            let data = cached.data;
            if (Array.isArray(data)) {
                data = (await mergeListCacheWithOutbox(
                    cacheKey,
                    data as { id?: string }[],
                )) as T;
            }
            return { data, fromCache: true, cachedAt: cached.cachedAt };
        }
        return { data: emptyValue, fromCache: networkStatus.getMode() === "offline" };
    };

    if (!networkStatus.isOnline()) {
        return tryCache();
    }

    try {
        const response = await fetcher();
        if (!isApiFailure(response)) {
            let data = extractData<T>(response) ?? emptyValue;
            if (Array.isArray(data)) {
                data = (await mergeListCacheWithOutbox(
                    cacheKey,
                    data as { id?: string }[],
                )) as T;
            }
            try {
                await setCachedList(cacheKey, data);
            } catch (cacheError) {
                console.warn("[offline] Échec écriture cache — données API conservées", cacheError);
            }
            networkStatus.reportApiSuccess();
            return { data, fromCache: false };
        }
        networkStatus.reportApiNetworkFailure();
    } catch (error) {
        if (isNetworkError(error)) {
            networkStatus.reportApiNetworkFailure();
        } else {
            console.warn("[offline] Erreur fetcher", error);
        }
    }

    try {
        return await tryCache();
    } catch (cacheError) {
        console.warn("[offline] Échec lecture cache", cacheError);
        return { data: emptyValue, fromCache: false };
    }
}
