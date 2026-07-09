'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapChargeAnalytiqueDtoToUi,
  mapChargeAnalytiqueUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { ChargeAnalytique } from '@/lib/analytique/mock-data';
import { mockCharges } from '@/lib/analytique/mock-data';
import {
  deleteChargeAnalytique,
  listChargesAnalytiques,
  saveChargeAnalytique,
  saveChargesAnalytiques,
} from '@/lib/analytique/charges-analytiques-store';
import { AccountingChargesAnalytiquesService } from '@/src/lib2/services/AccountingChargesAnalytiquesService';

export function useChargesAnalytiquesApi(periodeId?: string) {
  const [charges, setCharges] = useState<ChargeAnalytique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const params = periodeId ? { periodeId } : undefined;
      const response = await AccountingChargesAnalytiquesService.getAllCharges(params);
      const list = unwrapApiData(response, 'Impossible de charger les charges analytiques.').map(
        mapChargeAnalytiqueDtoToUi,
      );
      setCharges(list);
    } catch (err: unknown) {
      const local = listChargesAnalytiques();
      const filtered = periodeId
        ? local.filter((c) => c.periodeId === periodeId || local.every((x) => x.periodeId !== periodeId))
        : local;
      setCharges(filtered.length > 0 ? filtered : mockCharges);
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

  const saveCharge = useCallback(
    async (data: Partial<ChargeAnalytique>) => {
      if (usingMockFallback) {
        const entry = {
          ...data,
          id: data.id ?? `ch-${Date.now()}`,
          periodeId: data.periodeId ?? periodeId ?? 'cg-p3',
        } as ChargeAnalytique;
        const next = charges.find((c) => c.id === entry.id)
          ? charges.map((c) => (c.id === entry.id ? { ...c, ...entry } : c))
          : [...charges, entry];
        saveChargesAnalytiques(next);
        setCharges(next);
        toast.success(charges.find((c) => c.id === entry.id) ? 'Charge mise à jour' : 'Charge créée');
        return;
      }

      const dto = mapChargeAnalytiqueUiToDto(data);
      if (!dto.centreId || !dto.periodeId) {
        toast.error('Centre et période requis — vérifiez les données.');
        throw new Error('centreId et periodeId requis');
      }

      const isUpdate = Boolean(dto.id);
      const payload = {
        ...dto,
        nature: dto.nature,
        montant: dto.montant,
        type: dto.type,
        centreId: dto.centreId!,
        periodeId: dto.periodeId!,
      };
      const response = isUpdate
        ? await AccountingChargesAnalytiquesService.updateCharge(dto.id!, payload)
        : await AccountingChargesAnalytiquesService.createCharge(payload);
      const saved = mapChargeAnalytiqueDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la charge analytique.'),
      );
      setCharges((prev) =>
        isUpdate ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Charge mise à jour' : 'Charge créée');
    },
    [usingMockFallback, charges, periodeId],
  );

  const removeCharge = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        deleteChargeAnalytique(id);
        setCharges(listChargesAnalytiques());
        return;
      }
      await AccountingChargesAnalytiquesService.deleteCharge(id);
      setCharges((prev) => prev.filter((c) => c.id !== id));
      toast.success('Charge supprimée');
    },
    [usingMockFallback],
  );

  return {
    charges,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveCharge,
    removeCharge,
    setCharges,
  };
}
