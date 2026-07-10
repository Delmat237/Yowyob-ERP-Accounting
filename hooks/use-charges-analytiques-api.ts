'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapChargeAnalytiqueDtoToUi,
  mapChargeAnalytiqueUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { ChargeAnalytique } from '@/lib/analytique/mock-data';
import { CA_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { ensureLocalId } from '@/lib/offline/ensure-local-id';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import {
  removeListItemWithOutbox,
  upsertListItemWithOutbox,
} from '@/lib/offline/list-outbox-mutations';
import { AccountingChargesAnalytiquesService } from '@/src/lib2/services/AccountingChargesAnalytiquesService';

export function useChargesAnalytiquesApi(periodeId?: string) {
  const [charges, setCharges] = useState<ChargeAnalytique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: CA_CACHE_KEYS.CHARGES,
        fetcher: async () => {
          const params = periodeId ? { periodeId } : undefined;
          const response = await AccountingChargesAnalytiquesService.getAllCharges(params);
          return unwrapApiData(response, 'Impossible de charger les charges analytiques.').map(
            mapChargeAnalytiqueDtoToUi,
          );
        },
        emptyValue: [] as ChargeAnalytique[],
      });
      const filtered = periodeId
        ? result.data.filter((c) => !c.periodeId || c.periodeId === periodeId)
        : result.data;
      setCharges(filtered);
      setUsingCache(result.fromCache);
      if (result.fromCache) setError('Données hors ligne (cache local).');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Impossible de charger les charges analytiques.',
      );
    } finally {
      setLoading(false);
    }
  }, [periodeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCharge = useCallback(
    async (data: Partial<ChargeAnalytique>) => {
      const isUpdate = Boolean(data.id);
      const localId = ensureLocalId(data.id);
      const item = {
        ...data,
        id: localId,
        periodeId: data.periodeId ?? periodeId ?? '',
      } as ChargeAnalytique;

      const dto = mapChargeAnalytiqueUiToDto({ ...data, id: isUpdate ? data.id : undefined });
      if (!dto.centreId || !dto.periodeId) {
        toast.error('Centre et période requis — vérifiez les données.');
        throw new Error('centreId et periodeId requis');
      }

      const payload = {
        ...dto,
        nature: dto.nature,
        montant: dto.montant,
        type: dto.type,
        centreId: dto.centreId!,
        periodeId: dto.periodeId!,
      };

      const { queued } = await upsertListItemWithOutbox({
        cacheKey: CA_CACHE_KEYS.CHARGES,
        entity: 'ca.charges',
        action: isUpdate ? 'UPDATE' : 'CREATE',
        item,
        onlineMutator: () =>
          isUpdate
            ? AccountingChargesAnalytiquesService.updateCharge(dto.id!, payload)
            : AccountingChargesAnalytiquesService.createCharge(payload),
      });

      setCharges((prev) =>
        isUpdate ? prev.map((c) => (c.id === item.id ? item : c)) : [...prev, item],
      );
      toast.success(
        queued
          ? isUpdate
            ? 'Charge mise à jour (sync en attente)'
            : 'Charge créée (sync en attente)'
          : isUpdate
            ? 'Charge mise à jour'
            : 'Charge créée',
      );
      if (!queued) await load();
    },
    [load, periodeId],
  );

  const removeCharge = useCallback(async (id: string) => {
    const { queued } = await removeListItemWithOutbox({
      cacheKey: CA_CACHE_KEYS.CHARGES,
      entity: 'ca.charges',
      entityId: id,
      onlineMutator: () => AccountingChargesAnalytiquesService.deleteCharge(id),
    });
    setCharges((prev) => prev.filter((c) => c.id !== id));
    toast.success(queued ? 'Charge supprimée (sync en attente)' : 'Charge supprimée');
  }, []);

  return {
    charges,
    loading,
    error,
    usingMockFallback: usingCache,
    reload: load,
    saveCharge,
    removeCharge,
    setCharges,
  };
}
