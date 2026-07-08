'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapUniteDtoToUi, mapUniteUiToDto } from '@/lib/analytique/analytique-mappers';
import type { UniteOeuvre } from '@/lib/analytique/mock-data';
import { AccountingUnitesOeuvreService } from '@/src/lib2/services/AccountingUnitesOeuvreService';

export function useUnitesOeuvreApi() {
  const [unites, setUnites] = useState<UniteOeuvre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingUnitesOeuvreService.getAllUnites();
      const list = unwrapApiData(response, 'Impossible de charger les unités d\'œuvre.').map(
        mapUniteDtoToUi,
      );
      setUnites(list.sort((a, b) => a.code.localeCompare(b.code, 'fr')));
    } catch (err: unknown) {
      const { mockUnitesOeuvre } = await import('@/lib/analytique/mock-data');
      setUnites(mockUnitesOeuvre);
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

  const saveUnite = useCallback(
    async (data: UniteOeuvre) => {
      if (usingMockFallback) {
        setUnites((prev) =>
          prev.find((u) => u.id === data.id)
            ? prev.map((u) => (u.id === data.id ? data : u))
            : [...prev, data],
        );
        return;
      }

      const dto = mapUniteUiToDto(data);
      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingUnitesOeuvreService.updateUnite(dto.id!, dto)
        : await AccountingUnitesOeuvreService.createUnite(dto);
      const saved = mapUniteDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer l\'unité d\'œuvre.'),
      );
      setUnites((prev) =>
        isUpdate ? prev.map((u) => (u.id === saved.id ? saved : u)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Unité d\'œuvre mise à jour' : 'Unité d\'œuvre créée');
    },
    [usingMockFallback],
  );

  const deleteUnite = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        setUnites((prev) => prev.filter((u) => u.id !== id));
        return;
      }
      await AccountingUnitesOeuvreService.deleteUnite(id);
      setUnites((prev) => prev.filter((u) => u.id !== id));
      toast.success('Unité d\'œuvre supprimée');
    },
    [usingMockFallback],
  );

  return {
    unites,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveUnite,
    deleteUnite,
  };
}
