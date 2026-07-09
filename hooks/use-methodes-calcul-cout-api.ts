'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapMethodeCalculCoutDtoToUi,
  mapMethodeCalculCoutUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { MethodeCalculCoût } from '@/lib/analytique/mock-data';
import { mockMethodesCalcul } from '@/lib/analytique/mock-data';
import {
  listMethodesCalculCout,
  saveMethodesCalculCout,
} from '@/lib/analytique/methodes-calcul-cout-store';
import { AccountingMethodesCalculCoutService } from '@/src/lib2/services/AccountingMethodesCalculCoutService';

export function useMethodesCalculCoutApi() {
  const [methodes, setMethodes] = useState<MethodeCalculCoût[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingMethodesCalculCoutService.getAllMethodes();
      const list = unwrapApiData(response, 'Impossible de charger les méthodes de calcul.').map(
        mapMethodeCalculCoutDtoToUi,
      );
      setMethodes(list);
    } catch (err: unknown) {
      const local = listMethodesCalculCout();
      setMethodes(local.length > 0 ? local : mockMethodesCalcul);
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

  const saveMethode = useCallback(
    async (data: MethodeCalculCoût) => {
      if (usingMockFallback) {
        const updated =
          data.statut === 'ACTIF'
            ? methodes.map((m) =>
                m.planAnalytiqueId === data.planAnalytiqueId
                  ? { ...m, statut: 'ARCHIVE' as const }
                  : m,
              )
            : methodes;
        const next = updated.find((m) => m.id === data.id)
          ? updated.map((m) => (m.id === data.id ? data : m))
          : [...updated, data];
        saveMethodesCalculCout(next);
        setMethodes(next);
        toast.success(methodes.find((m) => m.id === data.id) ? 'Méthode mise à jour' : 'Méthode créée');
        return;
      }

      const dto = mapMethodeCalculCoutUiToDto(data);
      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingMethodesCalculCoutService.updateMethode(dto.id!, dto)
        : await AccountingMethodesCalculCoutService.createMethode(dto);
      const saved = mapMethodeCalculCoutDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la méthode de calcul.'),
      );
      setMethodes((prev) => {
        const archived =
          saved.statut === 'ACTIF'
            ? prev.map((m) =>
                m.planAnalytiqueId === saved.planAnalytiqueId && m.id !== saved.id
                  ? { ...m, statut: 'ARCHIVE' as const }
                  : m,
              )
            : prev;
        return isUpdate
          ? archived.map((m) => (m.id === saved.id ? saved : m))
          : [...archived, saved];
      });
      toast.success(isUpdate ? 'Méthode mise à jour' : 'Méthode créée');
    },
    [usingMockFallback, methodes],
  );

  return {
    methodes,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveMethode,
    setMethodes,
  };
}
