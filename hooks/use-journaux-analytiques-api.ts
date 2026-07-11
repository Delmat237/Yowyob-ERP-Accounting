'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapJournalDtoToUi, mapJournalUiToDto } from '@/lib/analytique/analytique-mappers';
import type { JournalAnalytiqueConfig } from '@/lib/analytique/journal-analytique';
import { fetchWithOfflineCache, readCachedList } from '@/lib/offline/fetch-with-cache';
import { CA_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { ensureLocalId } from '@/lib/offline/ensure-local-id';
import { isClientOffline } from '@/lib/offline/network-status';
import { upsertListItemWithOutbox } from '@/lib/offline/list-outbox-mutations';
import { AccountingJournauxAnalytiquesService } from '@/src/lib2/services/AccountingJournauxAnalytiquesService';

export function useJournauxAnalytiquesApi() {
  const [journaux, setJournaux] = useState<JournalAnalytiqueConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const load = useCallback(async () => {
    if (isClientOffline()) {
      const cached = await readCachedList<JournalAnalytiqueConfig[]>(
        CA_CACHE_KEYS.JOURNAUX,
        [],
      );
      if (cached.cachedAt) {
        setJournaux([...cached.data].sort((a, b) => a.code.localeCompare(b.code, 'fr')));
        setUsingCache(true);
        setError('Données hors ligne (cache local).');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: CA_CACHE_KEYS.JOURNAUX,
        fetcher: async () => {
          const response = await AccountingJournauxAnalytiquesService.getAllJournaux();
          return unwrapApiData(response, 'Impossible de charger les journaux analytiques.').map(
            mapJournalDtoToUi,
          );
        },
        emptyValue: [] as JournalAnalytiqueConfig[],
      });
      setJournaux([...result.data].sort((a, b) => a.code.localeCompare(b.code, 'fr')));
      setUsingCache(result.fromCache);
      if (result.fromCache) setError('Données hors ligne (cache local).');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Impossible de charger les journaux analytiques.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveJournal = useCallback(
    async (data: JournalAnalytiqueConfig) => {
      const isUpdate = Boolean(data.id);
      const item = { ...data, id: ensureLocalId(data.id || undefined) };
      const dto = mapJournalUiToDto({ ...data, id: isUpdate ? data.id : '' });

      const { queued } = await upsertListItemWithOutbox({
        cacheKey: CA_CACHE_KEYS.JOURNAUX,
        entity: 'ca.journaux',
        action: isUpdate ? 'UPDATE' : 'CREATE',
        item,
        onlineMutator: () =>
          isUpdate
            ? AccountingJournauxAnalytiquesService.updateJournal(dto.id!, dto)
            : AccountingJournauxAnalytiquesService.createJournal(dto),
      });

      setJournaux((prev) =>
        isUpdate ? prev.map((j) => (j.id === item.id ? item : j)) : [...prev, item],
      );
      toast.success(
        queued
          ? isUpdate
            ? 'Journal mis à jour (sync en attente)'
            : 'Journal créé (sync en attente)'
          : isUpdate
            ? 'Journal mis à jour'
            : 'Journal créé',
      );
      if (!queued) await load();
    },
    [load],
  );

  const createJournal = useCallback(
    async (data: Omit<JournalAnalytiqueConfig, 'id'>) => {
      await saveJournal({ ...data, id: '' });
    },
    [saveJournal],
  );

  return {
    journaux,
    loading,
    error,
    usingMockFallback: usingCache,
    reload: load,
    saveJournal,
    createJournal,
  };
}
