'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  mapConfigurationAnalytiqueDtoToUi,
  mapConfigurationAnalytiqueUiToDto,
} from '@/lib/analytique/analytique-mappers';
import {
  getAnalytiqueConfig,
  saveAnalytiqueConfig,
  type AnalytiqueConfig,
} from '@/lib/analytique/analytique-config-store';
import { mockGlobalConfig } from '@/lib/analytique/mock-data';
import { AccountingAnalytiqueConfigService } from '@/src/lib2/services/AccountingAnalytiqueConfigService';

const DEFAULT_CONFIG: AnalytiqueConfig = {
  ...mockGlobalConfig,
  importComptabiliteGeneraleActive: false,
};

export function useAnalytiqueConfigApi() {
  const [config, setConfig] = useState<AnalytiqueConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingAnalytiqueConfigService.getConfig();
      const loaded = mapConfigurationAnalytiqueDtoToUi(
        unwrapApiData(response, 'Impossible de charger la configuration analytique.'),
      );
      setConfig(loaded);
      saveAnalytiqueConfig(loaded);
    } catch (err: unknown) {
      const local = getAnalytiqueConfig();
      setConfig(local);
      setUsingMockFallback(true);
      setError(
        err instanceof Error
          ? `${err.message} — affichage des données locales.`
          : 'API indisponible — affichage des données locales.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveConfig = useCallback(
    async (next: AnalytiqueConfig) => {
      if (usingMockFallback) {
        saveAnalytiqueConfig(next);
        setConfig(next);
        return next;
      }

      const dto = mapConfigurationAnalytiqueUiToDto(next);
      const response = await AccountingAnalytiqueConfigService.saveConfig(dto);
      const saved = mapConfigurationAnalytiqueDtoToUi(
        unwrapApiData(response, 'Impossible d\'enregistrer la configuration analytique.'),
      );
      saveAnalytiqueConfig(saved);
      setConfig(saved);
      return saved;
    },
    [usingMockFallback],
  );

  const resetConfig = useCallback(() => {
    const reset: AnalytiqueConfig = { ...DEFAULT_CONFIG };
    setConfig(reset);
    return reset;
  }, []);

  return {
    config,
    setConfig,
    loading,
    error,
    usingMockFallback,
    reload: load,
    saveConfig,
    resetConfig,
  };
}
