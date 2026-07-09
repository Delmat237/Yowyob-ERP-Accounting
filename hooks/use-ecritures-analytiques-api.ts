'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapEcritureDtoToUi, mapEcritureUiToDto } from '@/lib/analytique/analytique-mappers';
import type { EcritureAnalytique, StatutEcritureAnalytique } from '@/lib/analytique/ecriture-analytique';
import { buildLignesImputation } from '@/lib/analytique/ecriture-lignes';
import {
  createEcritureAnalytique as createEcritureLocal,
  listEcrituresAnalytiques as listEcrituresLocal,
  rejectEcritureAnalytique as rejectEcritureLocal,
  validateEcritureAnalytique as validateEcritureLocal,
} from '@/lib/analytique/ecritures-analytiques-store';
import type { EcritureAnalytiqueFormData } from '@/components/analytique/ecriture-analytique-form';
import { importDepuisCG } from '@/lib/analytique/import-cg-api';
import type { ImportCgRequestDto } from '@/src/lib2/models/ImportCgRequestDto';
import { AccountingEcrituresAnalytiquesService } from '@/src/lib2/services/AccountingEcrituresAnalytiquesService';

function sortEcritures(items: EcritureAnalytique[]): EcritureAnalytique[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function useEcrituresAnalytiquesApi() {
  const [ecritures, setEcritures] = useState<EcritureAnalytique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingEcrituresAnalytiquesService.getAllEcritures();
      const list = unwrapApiData(response, 'Impossible de charger les écritures analytiques.').map(
        mapEcritureDtoToUi,
      );
      setEcritures(sortEcritures(list));
    } catch (err: unknown) {
      setEcritures(sortEcritures(listEcrituresLocal()));
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

  const listByStatut = useCallback(
    (statut: StatutEcritureAnalytique) => ecritures.filter((e) => e.statut === statut),
    [ecritures],
  );

  const createEcriture = useCallback(
    async (data: EcritureAnalytiqueFormData & { origine?: 'MANUELLE' | 'IMPORT_CG' }) => {
      const lignes = buildLignesImputation(data);
      const payload = { ...data, lignes, origine: data.origine ?? 'MANUELLE' };

      if (usingMockFallback) {
        createEcritureLocal(payload);
        setEcritures(sortEcritures(listEcrituresLocal()));
        return;
      }

      const dto = mapEcritureUiToDto(payload);
      const response = await AccountingEcrituresAnalytiquesService.createEcriture(dto);
      const saved = mapEcritureDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer l\'écriture analytique.'),
      );
      setEcritures((prev) => sortEcritures([saved, ...prev]));
      toast.success('Écriture enregistrée en brouillon');
    },
    [usingMockFallback],
  );

  const validateEcriture = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        validateEcritureLocal(id);
        setEcritures(sortEcritures(listEcrituresLocal()));
        toast.success('Écriture analytique validée');
        return;
      }

      const response = await AccountingEcrituresAnalytiquesService.validerEcriture(id);
      const saved = mapEcritureDtoToUi(
        unwrapApiData(response, 'Impossible de valider l\'écriture analytique.'),
      );
      setEcritures((prev) => sortEcritures(prev.map((e) => (e.id === saved.id ? saved : e))));
      toast.success('Écriture analytique validée');
    },
    [usingMockFallback],
  );

  const rejectEcriture = useCallback(
    async (id: string, reason: string) => {
      if (usingMockFallback) {
        rejectEcritureLocal(id, reason);
        setEcritures(sortEcritures(listEcrituresLocal()));
        toast.success('Écriture rejetée');
        return;
      }

      const response = await AccountingEcrituresAnalytiquesService.rejeterEcriture(id, {
        raison: reason,
      });
      const saved = mapEcritureDtoToUi(
        unwrapApiData(response, 'Impossible de rejeter l\'écriture analytique.'),
      );
      setEcritures((prev) => sortEcritures(prev.map((e) => (e.id === saved.id ? saved : e))));
      toast.success('Écriture rejetée');
    },
    [usingMockFallback],
  );

  const countPiecesForYear = useCallback(
    (year: number) =>
      ecritures.filter((e) =>
        e.numeroPiece.match(new RegExp(`^(CA|ECRIT-ANALYTIQUE)-${year}-`)),
      ).length,
    [ecritures],
  );

  const importCg = useCallback(
    async (options?: ImportCgRequestDto) => {
      const result = await importDepuisCG(options, usingMockFallback);
      if (!usingMockFallback && result.created.length > 0) {
        setEcritures((prev) => sortEcritures([...result.created, ...prev]));
      } else if (usingMockFallback) {
        setEcritures(sortEcritures(listEcrituresLocal()));
      } else {
        await load();
      }
      return result;
    },
    [usingMockFallback, load],
  );

  return {
    ecritures,
    loading,
    error,
    usingMockFallback,
    reload: load,
    listByStatut,
    createEcriture,
    validateEcriture,
    rejectEcriture,
    countPiecesForYear,
    importCg,
  };
}
