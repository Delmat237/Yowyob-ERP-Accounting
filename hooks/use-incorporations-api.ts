'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapRegleIncorporationDtoToUi,
  mapRegleIncorporationUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { RegleIncorporation } from '@/lib/analytique/mock-data';
import { mockReglesIncorporation } from '@/lib/analytique/mock-data';
import {
  listReglesIncorporation,
  saveReglesIncorporation,
} from '@/lib/analytique/methodes-couts-store';
import { AccountingReglesIncorporationService } from '@/src/lib2/services/AccountingReglesIncorporationService';

export function useIncorporationsApi() {
  const [regles, setRegles] = useState<RegleIncorporation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingReglesIncorporationService.getAllRegles();
      const list = unwrapApiData(response, 'Impossible de charger les règles d\'incorporation.').map(
        mapRegleIncorporationDtoToUi,
      );
      setRegles(list);
    } catch (err: unknown) {
      const local = listReglesIncorporation();
      setRegles(local.length > 0 ? local : mockReglesIncorporation);
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
    async (data: RegleIncorporation) => {
      if (usingMockFallback) {
        const next = regles.find((r) => r.id === data.id)
          ? regles.map((r) => (r.id === data.id ? data : r))
          : [...regles, data];
        saveReglesIncorporation(next);
        setRegles(next);
        toast.success(regles.find((r) => r.id === data.id) ? 'Règle mise à jour' : 'Règle créée');
        return;
      }

      const dto = mapRegleIncorporationUiToDto(data);
      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingReglesIncorporationService.updateRegle(dto.id!, dto)
        : await AccountingReglesIncorporationService.createRegle(dto);
      const saved = mapRegleIncorporationDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la règle d\'incorporation.'),
      );
      setRegles((prev) =>
        isUpdate ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Règle mise à jour' : 'Règle créée');
    },
    [usingMockFallback, regles],
  );

  const removeRegle = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        const next = regles.filter((r) => r.id !== id);
        saveReglesIncorporation(next);
        setRegles(next);
        toast.success('Règle supprimée');
        return;
      }

      await AccountingReglesIncorporationService.deleteRegle(id);
      setRegles((prev) => prev.filter((r) => r.id !== id));
      toast.success('Règle supprimée');
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
    removeRegle,
    setRegles,
  };
}
