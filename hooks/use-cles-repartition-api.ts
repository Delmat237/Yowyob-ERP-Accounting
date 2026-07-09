'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapCleRepartitionDtoToUi,
  mapCleRepartitionUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { CleRepartitionUi } from '@/lib/analytique/cle-repartition';
import { mockClesRepartition } from '@/lib/analytique/cle-repartition';
import { AccountingClesRepartitionService } from '@/src/lib2/services/AccountingClesRepartitionService';

export function useClesRepartitionApi() {
  const [cles, setCles] = useState<CleRepartitionUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingClesRepartitionService.getAllCles();
      const list = unwrapApiData(response, 'Impossible de charger les clés de répartition.').map(
        mapCleRepartitionDtoToUi,
      );
      setCles(list.sort((a, b) => a.code.localeCompare(b.code, 'fr')));
    } catch (err: unknown) {
      setCles(mockClesRepartition);
      setUsingMockFallback(true);
      setError(
        err instanceof Error
          ? `${err.message} — affichage des données de démonstration.`
          : 'API indisponible — affichage des données de démonstration.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCle = useCallback(
    async (data: Partial<CleRepartitionUi>) => {
      if (usingMockFallback) {
        const payload: CleRepartitionUi = {
          id: data.id ?? `cle-${Date.now()}`,
          code: data.code ?? '',
          libelle: data.libelle ?? '',
          type: data.type ?? 'FIXE',
          actif: data.actif ?? true,
          lignes: data.lignes ?? [],
        };
        setCles((prev) =>
          payload.id && prev.find((c) => c.id === payload.id)
            ? prev.map((c) => (c.id === payload.id ? { ...c, ...payload } : c))
            : [...prev, payload],
        );
        return;
      }

      const dto = mapCleRepartitionUiToDto(data);
      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingClesRepartitionService.updateCle(dto.id!, dto)
        : await AccountingClesRepartitionService.createCle(dto);
      const saved = mapCleRepartitionDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la clé de répartition.'),
      );
      setCles((prev) =>
        isUpdate ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Clé de répartition mise à jour' : 'Clé de répartition créée');
    },
    [usingMockFallback],
  );

  const deleteCle = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        setCles((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      await AccountingClesRepartitionService.deleteCle(id);
      setCles((prev) => prev.filter((c) => c.id !== id));
      toast.success('Clé de répartition supprimée');
    },
    [usingMockFallback],
  );

  return {
    cles,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveCle,
    deleteCle,
  };
}
