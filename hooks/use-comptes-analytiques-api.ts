'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapCompteDtoToUi, mapCompteUiToDto } from '@/lib/analytique/analytique-mappers';
import type { CompteAnalytique } from '@/lib/analytique/mock-data';
import { AccountingComptesAnalytiquesService } from '@/src/lib2/services/AccountingComptesAnalytiquesService';

export function useComptesAnalytiquesApi() {
  const [comptes, setComptes] = useState<CompteAnalytique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingComptesAnalytiquesService.getAllComptes();
      const list = unwrapApiData(response, 'Impossible de charger les comptes analytiques.').map(
        mapCompteDtoToUi,
      );
      setComptes(list.sort((a, b) => a.numero.localeCompare(b.numero, 'fr')));
    } catch (err: unknown) {
      const { mockComptesAnalytiques } = await import('@/lib/analytique/mock-data');
      setComptes(mockComptesAnalytiques);
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

  const saveCompte = useCallback(
    async (data: Partial<CompteAnalytique>) => {
      if (usingMockFallback) {
        const payload = {
          ...data,
          numero: data.numero!.trim(),
          libelle: data.libelle!.trim(),
          classe: data.classe!,
          actif: data.actif ?? true,
        } as CompteAnalytique;
        setComptes((prev) =>
          payload.id && prev.find((c) => c.id === payload.id)
            ? prev.map((c) => (c.id === payload.id ? { ...c, ...payload } : c))
            : [...prev, { ...payload, id: payload.id ?? `ca-${Date.now()}` }],
        );
        return;
      }

      const dto = mapCompteUiToDto(data);
      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingComptesAnalytiquesService.updateCompte(dto.id!, dto)
        : await AccountingComptesAnalytiquesService.createCompte(dto);
      const saved = mapCompteDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer le compte analytique.'),
      );
      setComptes((prev) =>
        isUpdate ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Compte analytique mis à jour' : 'Compte analytique créé');
    },
    [usingMockFallback],
  );

  const deleteCompte = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        setComptes((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      await AccountingComptesAnalytiquesService.deleteCompte(id);
      setComptes((prev) => prev.filter((c) => c.id !== id));
      toast.success('Compte analytique supprimé');
    },
    [usingMockFallback],
  );

  return {
    comptes,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveCompte,
    deleteCompte,
  };
}
