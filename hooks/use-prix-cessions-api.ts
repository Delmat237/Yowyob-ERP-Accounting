'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapPrixCessionDtoToUi,
  mapPrixCessionUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { PrixCessionInterne } from '@/lib/analytique/mock-data';
import { mockPrixCessions } from '@/lib/analytique/mock-data';
import { listPrixCessions, savePrixCessions } from '@/lib/analytique/methodes-couts-store';
import { AccountingPrixCessionsService } from '@/src/lib2/services/AccountingPrixCessionsService';

export function usePrixCessionsApi() {
  const [cessions, setCessions] = useState<PrixCessionInterne[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingPrixCessionsService.getAllPrixCessions();
      const list = unwrapApiData(response, 'Impossible de charger les prix de cession.').map(
        mapPrixCessionDtoToUi,
      );
      setCessions(list);
    } catch (err: unknown) {
      const local = listPrixCessions();
      setCessions(local.length > 0 ? local : mockPrixCessions);
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

  const saveCession = useCallback(
    async (data: PrixCessionInterne) => {
      if (usingMockFallback) {
        const next = cessions.find((c) => c.id === data.id)
          ? cessions.map((c) => (c.id === data.id ? data : c))
          : [...cessions, data];
        savePrixCessions(next);
        setCessions(next);
        toast.success(data.id && cessions.find((c) => c.id === data.id) ? 'Tarif mis à jour' : 'Tarif créé');
        return;
      }

      const dto = mapPrixCessionUiToDto(data);
      if (!dto.centreCedantId || !dto.centreBeneficiaireId || !dto.uniteId) {
        toast.error('Données invalides — sélectionnez des centres et une unité issues de l\'API.');
        throw new Error('champs UUID requis');
      }

      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingPrixCessionsService.updatePrixCession(dto.id!, dto)
        : await AccountingPrixCessionsService.createPrixCession(dto);
      const saved = mapPrixCessionDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer le prix de cession.'),
      );
      setCessions((prev) =>
        isUpdate ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Tarif mis à jour' : 'Tarif créé');
    },
    [usingMockFallback, cessions],
  );

  const removeCession = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        const next = cessions.filter((c) => c.id !== id);
        savePrixCessions(next);
        setCessions(next);
        return;
      }
      await AccountingPrixCessionsService.deletePrixCession(id);
      setCessions((prev) => prev.filter((c) => c.id !== id));
      toast.success('Tarif supprimé');
    },
    [usingMockFallback, cessions],
  );

  return {
    cessions,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveCession,
    removeCession,
  };
}
