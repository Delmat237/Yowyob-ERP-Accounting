'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapFicheCoutStandardDtoToUi,
  mapFicheCoutStandardUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { FicheCoutStandard } from '@/lib/analytique/mock-data';
import { mockFichesCoutStandard } from '@/lib/analytique/mock-data';
import { listFichesCoutStandard, saveFichesCoutStandard } from '@/lib/analytique/methodes-couts-store';
import { AccountingFichesCoutStandardService } from '@/src/lib2/services/AccountingFichesCoutStandardService';

export function useCoutsStandardsApi(periodeRefId?: string) {
  const [fiches, setFiches] = useState<FicheCoutStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const params = periodeRefId ? { periodeRefId } : undefined;
      const response = await AccountingFichesCoutStandardService.getAllFichesCoutStandard(params);
      const list = unwrapApiData(response, 'Impossible de charger les fiches de coût standard.').map(
        mapFicheCoutStandardDtoToUi,
      );
      setFiches(list);
    } catch (err: unknown) {
      const local = listFichesCoutStandard();
      const filtered = periodeRefId
        ? local.filter((f) => f.periodeRefId === periodeRefId || local.every((x) => x.periodeRefId !== periodeRefId))
        : local;
      setFiches(filtered.length > 0 ? filtered : mockFichesCoutStandard);
      setUsingMockFallback(true);
      setError(
        err instanceof Error
          ? `${err.message} — affichage des données de démonstration.`
          : 'API indisponible — affichage des données de démonstration.',
      );
    } finally {
      setLoading(false);
    }
  }, [periodeRefId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveFiche = useCallback(
    async (data: FicheCoutStandard) => {
      if (usingMockFallback) {
        const next = fiches.find((f) => f.id === data.id)
          ? fiches.map((f) => (f.id === data.id ? data : f))
          : [...fiches, data];
        saveFichesCoutStandard(next);
        setFiches(next);
        toast.success(fiches.find((f) => f.id === data.id) ? 'Fiche mise à jour' : 'Fiche créée');
        return;
      }

      const dto = mapFicheCoutStandardUiToDto(data);
      if (!dto.periodeRefId) {
        toast.error('Période invalide — sélectionnez une période issue de l\'API.');
        throw new Error('periodeRefId requis');
      }

      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingFichesCoutStandardService.updateFicheCoutStandard(dto.id!, dto)
        : await AccountingFichesCoutStandardService.createFicheCoutStandard(dto);
      const saved = mapFicheCoutStandardDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la fiche de coût standard.'),
      );
      setFiches((prev) =>
        isUpdate ? prev.map((f) => (f.id === saved.id ? saved : f)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Fiche mise à jour' : 'Fiche créée');
    },
    [usingMockFallback, fiches],
  );

  const removeFiche = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        const next = fiches.filter((f) => f.id !== id);
        saveFichesCoutStandard(next);
        setFiches(next);
        return;
      }
      await AccountingFichesCoutStandardService.deleteFicheCoutStandard(id);
      setFiches((prev) => prev.filter((f) => f.id !== id));
      toast.success('Fiche supprimée');
    },
    [usingMockFallback, fiches],
  );

  return {
    fiches,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveFiche,
    removeFiche,
    setFiches,
  };
}
