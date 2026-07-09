'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEcrituresAnalytiquesApi } from '@/hooks/use-ecritures-analytiques-api';
import { setControleBudgetContext } from '@/lib/analytique/controle-budgetaire';
import type { BudgetDto } from '@/src/lib2/models/BudgetDto';
import { AccountingBudgetsService } from '@/src/lib2/services/AccountingBudgetsService';

export function useControleBudgetaireData() {
  const { ecritures } = useEcrituresAnalytiquesApi();
  const [budgets, setBudgets] = useState<BudgetDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AccountingBudgetsService.getAllBudgets();
      setBudgets(response.data ?? []);
    } catch {
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setControleBudgetContext({ budgets, ecritures });
    return () => setControleBudgetContext(null);
  }, [budgets, ecritures]);

  return { budgets, ecritures, loading };
}
