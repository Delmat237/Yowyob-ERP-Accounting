'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapCentreDtoToUi, mapCentreUiToDto } from '@/lib/analytique/analytique-mappers';
import type { CentreAnalyse } from '@/lib/analytique/mock-data';
import { CA_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { ensureLocalId } from '@/lib/offline/ensure-local-id';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import {
  removeListItemWithOutbox,
  upsertListItemWithOutbox,
} from '@/lib/offline/list-outbox-mutations';
import { AccountingAnalyticsService } from '@/src/lib2/services/AccountingAnalyticsService';

export function useCentresAnalyseApi() {
  const [centres, setCentres] = useState<CentreAnalyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: CA_CACHE_KEYS.CENTRES,
        fetcher: async () => {
          const response = await AccountingAnalyticsService.getAllAxes();
          const list = unwrapApiData(response, "Impossible de charger les centres d'analyse.")
            .filter((dto) => dto.type === 'CENTRE_COUT' || dto.typeCentre)
            .map(mapCentreDtoToUi);
          return list.length > 0
            ? list
            : unwrapApiData(response, '').map(mapCentreDtoToUi);
        },
        emptyValue: [] as CentreAnalyse[],
      });
      setCentres(result.data);
      setUsingCache(result.fromCache);
      if (result.fromCache) {
        setError('Données hors ligne (cache local).');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les centres d'analyse.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCentre = useCallback(
    async (data: Partial<CentreAnalyse>) => {
      const isUpdate = Boolean(data.id);
      const localId = ensureLocalId(data.id);
      const item: CentreAnalyse = {
        id: localId,
        code: data.code ?? '',
        libelle: data.libelle ?? '',
        nature: data.nature ?? 'CENTRE_PRINCIPAL',
        uniteOeuvre: data.uniteOeuvre ?? '',
        axeId: data.axeId ?? '',
        actif: data.actif ?? true,
        compteAnalytiqueId: data.compteAnalytiqueId,
        responsable: data.responsable,
        budgetAlloue: data.budgetAlloue,
        typePrestation: data.typePrestation,
        exerciceId: data.exerciceId,
        periodeId: data.periodeId,
      };

      const dto = mapCentreUiToDto({ ...data, id: isUpdate ? data.id : undefined });
      const { queued } = await upsertListItemWithOutbox({
        cacheKey: CA_CACHE_KEYS.CENTRES,
        entity: 'ca.centres',
        action: isUpdate ? 'UPDATE' : 'CREATE',
        item,
        onlineMutator: () =>
          isUpdate
            ? AccountingAnalyticsService.updateAxe(dto.id!, dto)
            : AccountingAnalyticsService.createAxe(dto),
      });

      setCentres((prev) =>
        isUpdate ? prev.map((c) => (c.id === item.id ? item : c)) : [...prev, item],
      );
      toast.success(
        queued
          ? isUpdate
            ? 'Centre mis à jour (sync en attente)'
            : 'Centre créé (sync en attente)'
          : isUpdate
            ? 'Centre mis à jour'
            : 'Centre créé',
      );
      if (!queued) await load();
    },
    [load],
  );

  const deleteCentre = useCallback(
    async (id: string) => {
      const { queued } = await removeListItemWithOutbox({
        cacheKey: CA_CACHE_KEYS.CENTRES,
        entity: 'ca.centres',
        entityId: id,
        onlineMutator: () => AccountingAnalyticsService.deleteAxe(id),
      });
      setCentres((prev) => prev.filter((c) => c.id !== id));
      toast.success(queued ? 'Centre supprimé (sync en attente)' : 'Centre supprimé');
    },
    [],
  );

  return {
    centres,
    loading,
    error,
    usingMockFallback: usingCache,
    reload: load,
    saveCentre,
    deleteCentre,
  };
}
