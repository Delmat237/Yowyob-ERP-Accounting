'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePeriodesAnalytiquesAlignees } from '@/hooks/use-periodes-analytiques-alignees';
import { useEcrituresAnalytiquesApi } from '@/hooks/use-ecritures-analytiques-api';
import { useChargesVentilees } from '@/hooks/use-charges-ventilees';
import { useCoutsAnalytiquesApi } from '@/hooks/use-couts-analytiques-api';
import {
  buildLignesAutoFromCharges,
  computeConcordance,
  mergeLignesConcordance,
} from '@/lib/analytique/concordance-calculs';
import {
  listLignesConcordance,
  saveLignesConcordance,
} from '@/lib/analytique/methodes-couts-store';
import type { LigneConcordance } from '@/lib/analytique/mock-data';
import { listChargesVentilees } from '@/lib/analytique/charges-ventilees-store';
import { mockChargesVentilees } from '@/lib/analytique/mock-data';

export function useConcordanceApi() {
  const {
    periodes,
    periodesCG,
    loading: periodesLoading,
    error: periodesError,
    usingMockFallback: periodesMock,
  } = usePeriodesAnalytiquesAlignees();
  const {
    ecritures,
    loading: ecrituresLoading,
    error: ecrituresError,
    usingMockFallback: ecrituresMock,
  } = useEcrituresAnalytiquesApi();
  const { charges, loading: chargesLoading } = useChargesVentilees();
  const { produits, periodeId: coutsPeriodeId, setPeriodeId: setCoutsPeriodeId } = useCoutsAnalytiquesApi();

  const [periodeId, setPeriodeIdState] = useState('');
  const [lignesManuelles, setLignesManuelles] = useState<LigneConcordance[]>(() =>
    listLignesConcordance(),
  );

  const setPeriodeId = useCallback(
    (id: string) => {
      setPeriodeIdState(id);
      setCoutsPeriodeId(id);
    },
    [setCoutsPeriodeId],
  );

  useEffect(() => {
    if (periodes.length === 0 || periodeId) return;
    const enCours = periodes.find((p) => p.statut === 'EN_COURS');
    const ouvert = periodes.find((p) => p.statut === 'OUVERT');
    const initial = enCours?.id ?? ouvert?.id ?? periodes[0]?.id ?? '';
    setPeriodeIdState(initial);
    if (initial && !coutsPeriodeId) setCoutsPeriodeId(initial);
  }, [periodes, periodeId, coutsPeriodeId, setCoutsPeriodeId]);

  const chargesEffectives =
    charges.length > 0
      ? charges
      : typeof window !== 'undefined'
        ? listChargesVentilees()
        : mockChargesVentilees;

  const selectedPeriode = periodes.find((p) => p.id === periodeId);

  const lignesAuto = useMemo(
    () => buildLignesAutoFromCharges(chargesEffectives, periodeId),
    [chargesEffectives, periodeId],
  );

  const lignes = useMemo(
    () => mergeLignesConcordance(lignesManuelles, lignesAuto),
    [lignesManuelles, lignesAuto],
  );

  const concordance = useMemo(
    () =>
      computeConcordance({
        periode: selectedPeriode,
        periodesCG,
        charges: chargesEffectives,
        ecritures,
        produits,
        lignes,
        periodeId,
      }),
    [selectedPeriode, periodesCG, chargesEffectives, ecritures, produits, lignes, periodeId],
  );

  const saveLignes = useCallback((next: LigneConcordance[]) => {
    setLignesManuelles(next);
    saveLignesConcordance(next);
  }, []);

  const usingApiEcritures =
    !ecrituresMock &&
    ecritures.some((e) => e.statut === 'VALIDEE' && e.exerciceAnalytiqueId === periodeId);

  const loading = periodesLoading || ecrituresLoading || chargesLoading;
  const error = periodesError ?? ecrituresError;

  return {
    periodes,
    periodeId,
    setPeriodeId,
    selectedPeriode,
    lignes,
    lignesManuelles,
    saveLignes,
    concordance,
    loading,
    error,
    usingApiEcritures,
    usingMockFallback: periodesMock || ecrituresMock,
    hasLignesAuto: lignesAuto.length > 0,
  };
}
