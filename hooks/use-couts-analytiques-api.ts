'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCentresAnalyseApi } from '@/hooks/use-centres-analyse-api';
import { useCoutsProduitsApi } from '@/hooks/use-couts-produits-api';
import { useEcrituresAnalytiquesApi } from '@/hooks/use-ecritures-analytiques-api';
import { usePeriodesAnalytiquesAlignees } from '@/hooks/use-periodes-analytiques-alignees';
import {
  buildImputationRationnelleRows,
  buildProduitDirectCostingData,
  enrichCoutsProduits,
} from '@/lib/analytique/couts-calculs';
import { listImputationRows } from '@/lib/analytique/methodes-couts-store';
import { mockCoutsProduits, type CoutProduit } from '@/lib/analytique/mock-data';

export function useCoutsAnalytiquesApi() {
  const {
    periodes,
    loading: periodesLoading,
    error: periodesError,
    usingMockFallback: periodesMock,
  } = usePeriodesAnalytiquesAlignees();
  const { centres, loading: centresLoading, error: centresError } = useCentresAnalyseApi();
  const {
    ecritures,
    loading: ecrituresLoading,
    error: ecrituresError,
    usingMockFallback: ecrituresMock,
  } = useEcrituresAnalytiquesApi();

  const [periodeId, setPeriodeId] = useState('');

  useEffect(() => {
    if (periodes.length === 0 || periodeId) return;
    const enCours = periodes.find((p) => p.statut === 'EN_COURS');
    const ouvert = periodes.find((p) => p.statut === 'OUVERT');
    setPeriodeId(enCours?.id ?? ouvert?.id ?? periodes[0]?.id ?? '');
  }, [periodes, periodeId]);

  const {
    produits: produitsApi,
    loading: produitsLoading,
    error: produitsError,
    usingMockFallback: produitsMock,
  } = useCoutsProduitsApi(periodeId || undefined);

  const produitsBase = useMemo(() => {
    if (produitsApi.length > 0) return produitsApi;
    return mockCoutsProduits.filter(
      (p) => !periodeId || p.periodeId === periodeId || mockCoutsProduits.every((x) => x.periodeId !== periodeId),
    );
  }, [produitsApi, periodeId]);

  const produitsEnrichis = useMemo(
    () => enrichCoutsProduits(produitsBase.length > 0 ? produitsBase : mockCoutsProduits, ecritures, periodeId),
    [produitsBase, ecritures, periodeId],
  );

  const produitsDirectCosting = useMemo(
    () => buildProduitDirectCostingData(produitsEnrichis),
    [produitsEnrichis],
  );

  const imputationRows = useMemo(
    () =>
      buildImputationRationnelleRows(
        centres,
        ecritures,
        periodeId,
        listImputationRows(),
      ),
    [centres, ecritures, periodeId],
  );

  const usingApiEcritures =
    !ecrituresMock && ecritures.some((e) => e.statut === 'VALIDEE' && e.exerciceAnalytiqueId === periodeId);

  const loading = periodesLoading || centresLoading || ecrituresLoading || produitsLoading;
  const error = periodesError ?? centresError ?? ecrituresError ?? produitsError;

  return {
    periodes,
    periodeId,
    setPeriodeId,
    centres,
    ecritures,
    produits: produitsEnrichis as CoutProduit[],
    produitsDirectCosting,
    imputationRows,
    loading,
    error,
    usingApiEcritures,
    usingMockFallback: periodesMock || ecrituresMock || produitsMock,
    usingMockProduits: produitsMock,
  };
}
