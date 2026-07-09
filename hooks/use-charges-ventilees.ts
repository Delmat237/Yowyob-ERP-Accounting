'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapChargeVentileeDtoToUi,
  mapChargeVentileeUiToDto,
} from '@/lib/analytique/analytique-mappers';
import type { ChargeVentilee } from '@/lib/analytique/mock-data';
import { mockChargesVentilees } from '@/lib/analytique/mock-data';
import {
  deleteChargeVentilee,
  listChargesVentilees,
  saveChargeVentilee,
} from '@/lib/analytique/charges-ventilees-store';
import { AccountingChargesVentileesService } from '@/src/lib2/services/AccountingChargesVentileesService';

export function useChargesVentilees() {
  const [charges, setCharges] = useState<ChargeVentilee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingChargesVentileesService.getAllCharges();
      const list = unwrapApiData(response, 'Impossible de charger les charges ventilées.').map(
        mapChargeVentileeDtoToUi,
      );
      setCharges(list);
    } catch (err: unknown) {
      const local = listChargesVentilees();
      setCharges(local.length > 0 ? local : mockChargesVentilees);
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

  const saveCharge = useCallback(
    async (data: ChargeVentilee) => {
      if (usingMockFallback) {
        saveChargeVentilee(data);
        setCharges(listChargesVentilees());
        return;
      }

      const dto = mapChargeVentileeUiToDto(data);
      if (!dto.periodeId) {
        toast.error('Période invalide — sélectionnez une période issue de l\'API.');
        throw new Error('periodeId UUID requis');
      }

      const isUpdate = Boolean(dto.id);
      const response = isUpdate
        ? await AccountingChargesVentileesService.updateCharge(dto.id!, dto)
        : await AccountingChargesVentileesService.createCharge(dto);
      const saved = mapChargeVentileeDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la charge ventilée.'),
      );
      setCharges((prev) =>
        isUpdate ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved],
      );
      toast.success(isUpdate ? 'Ventilation mise à jour' : 'Ventilation créée');
    },
    [usingMockFallback],
  );

  const removeCharge = useCallback(
    async (id: string) => {
      if (usingMockFallback) {
        deleteChargeVentilee(id);
        setCharges(listChargesVentilees());
        return;
      }
      await AccountingChargesVentileesService.deleteCharge(id);
      setCharges((prev) => prev.filter((c) => c.id !== id));
      toast.success('Ventilation supprimée');
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
  };
}
