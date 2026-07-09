'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapRegleValorisationStockDtoToUi,
  mapRegleValorisationStockUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { RegleValorisationStock } from '@/lib/analytique/mock-data';
import { mockReglesValorisationStock } from '@/lib/analytique/mock-data';
import {
  listReglesValorisationStock,
  saveReglesValorisationStock,
} from '@/lib/analytique/regles-valorisation-store';
import { AccountingReglesValorisationStockService } from '@/src/lib2/services/AccountingReglesValorisationStockService';

export function useReglesValorisationStockApi() {
  const [regles, setRegles] = useState<RegleValorisationStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingReglesValorisationStockService.getAllRegles();
      const list = unwrapApiData(response, 'Impossible de charger les règles de valorisation.').map(
        mapRegleValorisationStockDtoToUi,
      );
      setRegles(list);
    } catch (err: unknown) {
      const local = listReglesValorisationStock();
      setRegles(local.length > 0 ? local : mockReglesValorisationStock);
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

  const saveRegle = useCallback(
    async (data: RegleValorisationStock) => {
      if (usingMockFallback) {
        const next = regles.find((r) => r.id === data.id)
          ? regles.map((r) => (r.id === data.id ? data : r))
          : [...regles, data];
        saveReglesValorisationStock(next);
        setRegles(next);
        toast.success(regles.find((r) => r.id === data.id) ? 'Règle mise à jour' : 'Règle créée');
        return;
      }

      const dto = mapRegleValorisationStockUiToDto(data);
      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingReglesValorisationStockService.updateRegle(dto.id!, dto)
        : await AccountingReglesValorisationStockService.createRegle(dto);
      const saved = mapRegleValorisationStockDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la règle de valorisation.'),
      );
      setRegles((prev) =>
        isUpdate ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Règle mise à jour' : 'Règle créée');
    },
    [usingMockFallback, regles],
  );

  return {
    regles,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveRegle,
    setRegles,
  };
}
