'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapCoutProduitDtoToUi,
  mapCoutProduitUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { CoutProduit } from '@/lib/analytique/mock-data';
import { mockCoutsProduits } from '@/lib/analytique/mock-data';
import { listCoutsProduits, saveCoutsProduits } from '@/lib/analytique/methodes-couts-store';
import { AccountingCoutsProduitsService } from '@/src/lib2/services/AccountingCoutsProduitsService';

export function useCoutsProduitsApi(periodeId?: string) {
  const [produits, setProduits] = useState<CoutProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const params = periodeId ? { periodeId } : undefined;
      const response = await AccountingCoutsProduitsService.getAllCoutsProduits(params);
      const list = unwrapApiData(response, 'Impossible de charger les coûts produits.').map(
        mapCoutProduitDtoToUi,
      );
      setProduits(list);
    } catch (err: unknown) {
      const local = listCoutsProduits();
      const filtered = periodeId
        ? local.filter((p) => p.periodeId === periodeId || local.every((x) => x.periodeId !== periodeId))
        : local;
      setProduits(filtered.length > 0 ? filtered : mockCoutsProduits);
      setUsingMockFallback(true);
      setError(
        err instanceof Error
          ? `${err.message} — affichage des données de démonstration.`
          : 'API indisponible — affichage des données de démonstration.',
      );
    } finally {
      setLoading(false);
    }
  }, [periodeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProduit = useCallback(
    async (data: CoutProduit) => {
      if (usingMockFallback) {
        const next = produits.find((p) => p.id === data.id)
          ? produits.map((p) => (p.id === data.id ? data : p))
          : [...produits, data];
        saveCoutsProduits(next);
        setProduits(next);
        toast.success(produits.find((p) => p.id === data.id) ? 'Coût produit mis à jour' : 'Coût produit créé');
        return;
      }

      const dto = mapCoutProduitUiToDto(data);
      if (!dto.periodeId) {
        toast.error('Période invalide — sélectionnez une période issue de l\'API.');
        throw new Error('periodeId requis');
      }

      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingCoutsProduitsService.updateCoutProduit(dto.id!, dto)
        : await AccountingCoutsProduitsService.createCoutProduit(dto);
      const saved = mapCoutProduitDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer le coût produit.'),
      );
      setProduits((prev) =>
        isUpdate ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Coût produit mis à jour' : 'Coût produit créé');
    },
    [usingMockFallback, produits],
  );

  const removeProduit = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        const next = produits.filter((p) => p.id !== id);
        saveCoutsProduits(next);
        setProduits(next);
        return;
      }
      await AccountingCoutsProduitsService.deleteCoutProduit(id);
      setProduits((prev) => prev.filter((p) => p.id !== id));
      toast.success('Coût produit supprimé');
    },
    [usingMockFallback, produits],
  );

  return {
    produits,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveProduit,
    removeProduit,
  };
}
