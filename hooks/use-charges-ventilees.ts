'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChargeVentilee } from '@/lib/analytique/mock-data';
import {
  deleteChargeVentilee,
  listChargesVentilees,
  saveChargeVentilee,
} from '@/lib/analytique/charges-ventilees-store';

export function useChargesVentilees() {
  const [charges, setCharges] = useState<ChargeVentilee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    try {
      setCharges(listChargesVentilees());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveCharge = useCallback((data: ChargeVentilee) => {
    saveChargeVentilee(data);
    setCharges(listChargesVentilees());
  }, []);

  const removeCharge = useCallback((id: string) => {
    deleteChargeVentilee(id);
    setCharges(listChargesVentilees());
  }, []);

  return {
    charges,
    loading,
    reload: load,
    saveCharge,
    removeCharge,
  };
}
