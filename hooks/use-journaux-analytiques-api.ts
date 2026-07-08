'use client';

import { useCallback, useEffect, useState } from 'react';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapJournalDtoToUi, mapJournalUiToDto } from '@/lib/analytique/analytique-mappers';
import type { JournalAnalytiqueConfig } from '@/lib/analytique/journal-analytique';
import { AccountingJournauxAnalytiquesService } from '@/src/lib2/services/AccountingJournauxAnalytiquesService';

export function useJournauxAnalytiquesApi() {
  const [journaux, setJournaux] = useState<JournalAnalytiqueConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingJournauxAnalytiquesService.getAllJournaux();
      const list = unwrapApiData(response, 'Impossible de charger les journaux analytiques.').map(
        mapJournalDtoToUi,
      );
      setJournaux(list.sort((a, b) => a.code.localeCompare(b.code, 'fr')));
    } catch (err: unknown) {
      const { listJournauxAnalytiques } = await import('@/lib/analytique/journaux-analytiques-store');
      setJournaux(listJournauxAnalytiques());
      setUsingMockFallback(true);
      setError(
        err instanceof Error
          ? `${err.message} — affichage des données locales.`
          : 'API indisponible — affichage des données locales.',
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
      if (usingMockFallback) {
        const { saveJournalAnalytique } = await import('@/lib/analytique/journaux-analytiques-store');
        saveJournalAnalytique(data);
        await load();
        return;
      }

      const dto = mapJournalUiToDto(data);
      const isUpdate = Boolean(dto.id);
      if (isUpdate) {
        await AccountingJournauxAnalytiquesService.updateJournal(dto.id!, dto);
      } else {
        await AccountingJournauxAnalytiquesService.createJournal(dto);
      }
      await load();
    },
    [load, usingMockFallback],
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
    usingMockFallback,
    reload: load,
    saveJournal,
    createJournal,
  };
}
