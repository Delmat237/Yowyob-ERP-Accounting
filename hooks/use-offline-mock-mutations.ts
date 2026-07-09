"use client";

import { useCallback } from "react";
import { ensureLocalId } from "@/lib/offline/ensure-local-id";
import {
    removeListItemWithOutbox,
    upsertListItemWithOutbox,
} from "@/lib/offline/list-outbox-mutations";
import type { useOfflineMockList } from "@/hooks/use-offline-mock-list";

type MockListHook<T> = ReturnType<typeof useOfflineMockList<T[]>>;

/**
 * Mutations outbox pour listes mock CA (centres, charges, plan, etc.).
 */
export function useOfflineMockMutations<T extends { id?: string }>(
    cacheKey: string,
    entity: string,
    listHook: MockListHook<T>,
) {
    const { data, setData, reload } = listHook;

    const upsertItem = useCallback(
        async (partial: Partial<T> & { id?: string }, defaults?: Partial<T>) => {
            const isUpdate = Boolean(partial.id && data.some((item) => item.id === partial.id));
            const existing = isUpdate ? data.find((item) => item.id === partial.id) : undefined;
            const item = {
                ...(defaults ?? {}),
                ...(existing ?? {}),
                ...partial,
                id: ensureLocalId(partial.id ?? existing?.id),
            } as T;

            await upsertListItemWithOutbox({
                cacheKey,
                entity,
                action: isUpdate ? "UPDATE" : "CREATE",
                item,
                onlineMutator: async () => ({ success: true, data: item }),
            });

            setData((prev) => {
                const idx = prev.findIndex((entry) => entry.id === item.id);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = item;
                    return next;
                }
                return [item, ...prev];
            });

            return item;
        },
        [cacheKey, data, entity, setData],
    );

    const removeItem = useCallback(
        async (entityId: string) => {
            await removeListItemWithOutbox({
                cacheKey,
                entity,
                entityId,
                onlineMutator: async () => ({ success: true }),
            });
            setData((prev) => prev.filter((item) => item.id !== entityId));
        },
        [cacheKey, entity, setData],
    );

    return { upsertItem, removeItem, reload };
}
