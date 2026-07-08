'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapCentreDtoToUi, mapCentreUiToDto } from '@/lib/analytique/analytique-mappers';
import type { CentreAnalyse } from '@/lib/analytique/mock-data';
import { AccountingAnalyticsService } from '@/src/lib2/services/AccountingAnalyticsService';

export function useCentresAnalyseApi() {
  const [centres, setCentres] = useState<CentreAnalyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingAnalyticsService.getAllAxes();
      const list = unwrapApiData(response, 'Impossible de charger les centres d\'analyse.')
        .filter((dto) => dto.type === 'CENTRE_COUT' || dto.typeCentre)
        .map(mapCentreDtoToUi);
      setCentres(list.length > 0 ? list : unwrapApiData(response, '').map(mapCentreDtoToUi));
    } catch (err: unknown) {
      const { mockCentres } = await import('@/lib/analytique/mock-data');
      setCentres(mockCentres);
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

  const saveCentre = useCallback(
    async (data: Partial<CentreAnalyse>) => {
      if (usingMockFallback) {
        if (data.id) {
          setCentres((prev) => prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
        } else {
          setCentres((prev) => [
            ...prev,
            {
              id: `c${Date.now()}`,
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
            },
          ]);
        }
        return;
      }

      const dto = mapCentreUiToDto(data);
      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingAnalyticsService.updateAxe(dto.id!, dto)
        : await AccountingAnalyticsService.createAxe(dto);
      const saved = mapCentreDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer le centre d\'analyse.'),
      );
      setCentres((prev) =>
        isUpdate ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Centre mis à jour' : 'Centre créé');
    },
    [usingMockFallback],
  );

  const deleteCentre = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        setCentres((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      await AccountingAnalyticsService.deleteAxe(id);
      setCentres((prev) => prev.filter((c) => c.id !== id));
      toast.success('Centre supprimé');
    },
    [usingMockFallback],
  );

  return {
    centres,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveCentre,
    deleteCentre,
  };
}
