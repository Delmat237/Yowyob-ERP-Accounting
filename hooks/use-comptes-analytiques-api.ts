'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapCompteDtoToUi, mapCompteUiToDto } from '@/lib/analytique/analytique-mappers';
import type { CompteAnalytique } from '@/lib/analytique/mock-data';
import { CA_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { ensureLocalId } from '@/lib/offline/ensure-local-id';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import {
  removeListItemWithOutbox,
  upsertListItemWithOutbox,
} from '@/lib/offline/list-outbox-mutations';
import { AccountingComptesAnalytiquesService } from '@/src/lib2/services/AccountingComptesAnalytiquesService';

export function useComptesAnalytiquesApi() {
  const [comptes, setComptes] = useState<CompteAnalytique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: CA_CACHE_KEYS.COMPTES,
        fetcher: async () => {
          const response = await AccountingComptesAnalytiquesService.getAllComptes();
          return unwrapApiData(response, 'Impossible de charger les comptes analytiques.').map(
            mapCompteDtoToUi,
          );
        },
        emptyValue: [] as CompteAnalytique[],
      });
      setComptes([...result.data].sort((a, b) => a.numero.localeCompare(b.numero, 'fr')));
      setUsingCache(result.fromCache);
      if (result.fromCache) setError('Données hors ligne (cache local).');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Impossible de charger les comptes analytiques.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCompte = useCallback(
    async (data: Partial<CompteAnalytique>) => {
      const isUpdate = Boolean(data.id);
      const localId = ensureLocalId(data.id);
      const item = {
        ...data,
        id: localId,
        numero: data.numero!.trim(),
        libelle: data.libelle!.trim(),
        classe: data.classe!,
        actif: data.actif ?? true,
      } as CompteAnalytique;

      const dto = mapCompteUiToDto({ ...data, id: isUpdate ? data.id : undefined });
      const { queued } = await upsertListItemWithOutbox({
        cacheKey: CA_CACHE_KEYS.COMPTES,
        entity: 'ca.comptes',
        action: isUpdate ? 'UPDATE' : 'CREATE',
        item,
        onlineMutator: () =>
          isUpdate
            ? AccountingComptesAnalytiquesService.updateCompte(dto.id!, dto)
            : AccountingComptesAnalytiquesService.createCompte(dto),
      });

      setComptes((prev) =>
        isUpdate ? prev.map((c) => (c.id === item.id ? item : c)) : [...prev, item],
      );
      toast.success(
        queued
          ? isUpdate
            ? 'Compte mis à jour (sync en attente)'
            : 'Compte créé (sync en attente)'
          : isUpdate
            ? 'Compte analytique mis à jour'
            : 'Compte analytique créé',
      );
      if (!queued) await load();
    },
    [load],
  );

  const deleteCompte = useCallback(async (id: string) => {
    const { queued } = await removeListItemWithOutbox({
      cacheKey: CA_CACHE_KEYS.COMPTES,
      entity: 'ca.comptes',
      entityId: id,
      onlineMutator: () => AccountingComptesAnalytiquesService.deleteCompte(id),
    });
    setComptes((prev) => prev.filter((c) => c.id !== id));
    toast.success(queued ? 'Compte supprimé (sync en attente)' : 'Compte analytique supprimé');
  }, []);

  return {
    comptes,
    loading,
    error,
    usingMockFallback: usingCache,
    reload: load,
    saveCompte,
    deleteCompte,
  };
}
