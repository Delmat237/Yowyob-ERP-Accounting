'use client';

import { useMemo } from 'react';
import { useCoutsStandardsApi } from '@/hooks/use-couts-standards-api';
import { useCoutsProduitsApi } from '@/hooks/use-couts-produits-api';
import {
  buildEcartsFromApiData,
  getMockEcarts,
  type EcartCoutPreetabli,
} from '@/lib/analytique/couts-pretablis-calculs';

export function useCoutsPreetablisApi(periodeRefId?: string) {
  const {
    fiches,
    loading: loadingFiches,
    error: errorFiches,
    usingMockFallback: mockFiches,
  } = useCoutsStandardsApi(periodeRefId);
  const {
    produits,
    loading: loadingProduits,
    error: errorProduits,
    usingMockFallback: mockProduits,
  } = useCoutsProduitsApi(periodeRefId);

  const usingMockFallback = mockFiches || mockProduits;
  const loading = loadingFiches || loadingProduits;
  const error = errorFiches || errorProduits;

  const ecarts: EcartCoutPreetabli[] = useMemo(() => {
    if (usingMockFallback && fiches.length === 0) {
      return getMockEcarts();
    }
    return buildEcartsFromApiData(fiches, produits);
  }, [fiches, produits, usingMockFallback]);

  return {
    ecarts,
    loading,
    error,
    usingMockFallback,
  };
}
