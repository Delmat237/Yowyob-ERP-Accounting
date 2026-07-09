import { idbGet, idbPut } from "@/lib/offline/idb";
import type { MetaEntry } from "@/lib/offline/types";

const LIST_PREFIX = "list.cache.";

export type CachedList<T> = {
    data: T;
    cachedAt: string;
};

function metaKey(cacheKey: string): string {
    return `${LIST_PREFIX}${cacheKey}`;
}

export async function setCachedList<T>(cacheKey: string, data: T): Promise<void> {
    const entry: MetaEntry = {
        key: metaKey(cacheKey),
        value: { data, cachedAt: new Date().toISOString() } satisfies CachedList<T>,
    };
    await idbPut("meta", entry);
}

export async function getCachedList<T>(cacheKey: string): Promise<CachedList<T> | null> {
    const entry = await idbGet<MetaEntry>("meta", metaKey(cacheKey));
    if (!entry?.value || typeof entry.value !== "object") return null;
    const payload = entry.value as CachedList<T>;
    if (!("data" in payload)) return null;
    return payload;
}

export async function hasCachedList(cacheKey: string): Promise<boolean> {
    return (await getCachedList(cacheKey)) !== null;
}

export async function upsertInCachedList<T extends { id?: string }>(
    cacheKey: string,
    item: T,
): Promise<void> {
    const cached = await getCachedList<T[]>(cacheKey);
    const list = [...(cached?.data ?? [])];
    const idx = list.findIndex((e) => e.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    await setCachedList(cacheKey, list);
}

export async function removeFromCachedList(cacheKey: string, entityId: string): Promise<void> {
    const cached = await getCachedList<{ id?: string }[]>(cacheKey);
    if (!cached) return;
    await setCachedList(
        cacheKey,
        cached.data.filter((e) => e.id !== entityId),
    );
}

