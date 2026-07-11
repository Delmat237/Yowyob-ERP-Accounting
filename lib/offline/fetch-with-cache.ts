import { getCachedList, setCachedList } from "@/lib/offline/list-cache";
import { isClientOffline, isNetworkError, networkStatus } from "@/lib/offline/network-status";
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

const FETCH_TIMEOUT_MS = 5000;

function withFetchTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("Fetch timeout")), ms);
        promise.then(
            (value) => {
                window.clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                window.clearTimeout(timer);
                reject(error);
            },
        );
    });
}

function isFetchTimeout(error: unknown): boolean {
    return error instanceof Error && error.message === "Fetch timeout";
}

function extractData<T>(response: unknown): T | null {
    if (response != null && typeof response === "object" && "data" in response) {
        return ((response as ApiLike).data as T) ?? null;
    }
    return response as T;
}

/** Lit une liste depuis IndexedDB avec fusion outbox (sans appel réseau). */
export async function readCachedList<T>(cacheKey: string, emptyValue: T): Promise<OfflineFetchResult<T>> {
    const cached = await getCachedList<T>(cacheKey);
    if (!cached) {
        return { data: emptyValue, fromCache: isClientOffline() };
    }
    let data = cached.data;
    if (Array.isArray(data)) {
        data = (await mergeListCacheWithOutbox(
            cacheKey,
            data as { id?: string }[],
        )) as T;
    }
    return { data, fromCache: true, cachedAt: cached.cachedAt };
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
    const tryCache = async (): Promise<OfflineFetchResult<T>> =>
        readCachedList(cacheKey, emptyValue);

    if (isClientOffline()) {
        return tryCache();
    }

    try {
        const response = await withFetchTimeout(fetcher(), FETCH_TIMEOUT_MS);
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
        if (isNetworkError(error) || isFetchTimeout(error)) {
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
