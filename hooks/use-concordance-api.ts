'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import {
  isConcordancePeriodeApiReady,
  mergeConcordanceApiWithLocal,
} from '@/lib/analytique/concordance-api-merge';
import {
  buildLignesAutoFromCharges,
  computeConcordance,
  mergeLignesConcordance,
} from '@/lib/analytique/concordance-calculs';
import {
  mapLigneConcordanceDtoToUi,
  mapLignesConcordanceUiToDto,
} from '@/lib/analytique/analytique-mappers';
import {
  listLignesConcordance,
  saveLignesConcordance,
} from '@/lib/analytique/methodes-couts-store';
import type { LigneConcordance } from '@/lib/analytique/mock-data';
import { listChargesVentilees } from '@/lib/analytique/charges-ventilees-store';
import { mockChargesVentilees } from '@/lib/analytique/mock-data';
import { usePeriodesAnalytiquesAlignees } from '@/hooks/use-periodes-analytiques-alignees';
import { useEcrituresAnalytiquesApi } from '@/hooks/use-ecritures-analytiques-api';
import { useChargesVentilees } from '@/hooks/use-charges-ventilees';
import { useCoutsAnalytiquesApi } from '@/hooks/use-couts-analytiques-api';
import { AccountingConcordanceService } from '@/src/lib2/services/AccountingConcordanceService';
import type { ConcordanceCalculDto } from '@/src/lib2/models/ConcordanceCalculDto';

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
  const { charges, loading: chargesLoading, usingMockFallback: chargesMock } = useChargesVentilees();
  const { produits, periodeId: coutsPeriodeId, setPeriodeId: setCoutsPeriodeId } = useCoutsAnalytiquesApi();

  const [periodeId, setPeriodeIdState] = useState('');
  const [lignesManuelles, setLignesManuelles] = useState<LigneConcordance[]>(() =>
    listLignesConcordance(),
  );
  const [apiCalcul, setApiCalcul] = useState<ConcordanceCalculDto | null>(null);
  const [usingConcordanceApi, setUsingConcordanceApi] = useState(false);
  const [concordanceError, setConcordanceError] = useState<string | null>(null);

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

  const loadConcordanceApi = useCallback(async (pid: string) => {
    if (!isConcordancePeriodeApiReady(pid)) {
      setUsingConcordanceApi(false);
      setApiCalcul(null);
      setLignesManuelles(listLignesConcordance());
      return;
    }

    try {
      const response = await AccountingConcordanceService.getPeriode(pid);
      const data = unwrapApiData(response, 'Impossible de charger la concordance.');
      const manuelles = (data.lignesManuelles ?? data.calcul?.lignesManuelles ?? []).map(
        mapLigneConcordanceDtoToUi,
      );
      setLignesManuelles(manuelles);
      setApiCalcul(data.calcul ?? null);
      setUsingConcordanceApi(true);
      setConcordanceError(null);
    } catch (err: unknown) {
      setUsingConcordanceApi(false);
      setApiCalcul(null);
      setLignesManuelles(listLignesConcordance());
      setConcordanceError(
        err instanceof Error ? err.message : 'API concordance indisponible.',
      );
    }
  }, []);

  useEffect(() => {
    if (!periodeId) return;
    void loadConcordanceApi(periodeId);
  }, [periodeId, loadConcordanceApi]);

  const chargesEffectives =
    charges.length > 0
      ? charges
      : typeof window !== 'undefined'
        ? listChargesVentilees()
        : mockChargesVentilees;

  const selectedPeriode = periodes.find((p) => p.id === periodeId);

  const lignesAuto = useMemo(() => {
    if (usingConcordanceApi && apiCalcul?.lignesAuto) {
      return apiCalcul.lignesAuto.map(mapLigneConcordanceDtoToUi);
    }
    return buildLignesAutoFromCharges(chargesEffectives, periodeId);
  }, [usingConcordanceApi, apiCalcul, chargesEffectives, periodeId]);

  const lignes = useMemo(() => {
    if (usingConcordanceApi && apiCalcul?.lignes) {
      return apiCalcul.lignes.map(mapLigneConcordanceDtoToUi);
    }
    return mergeLignesConcordance(lignesManuelles, lignesAuto);
  }, [usingConcordanceApi, apiCalcul, lignesManuelles, lignesAuto]);

  const concordanceLocal = useMemo(
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

  const concordance = useMemo(
    () => mergeConcordanceApiWithLocal(concordanceLocal, apiCalcul, lignes),
    [concordanceLocal, apiCalcul, lignes],
  );

  const saveLignes = useCallback(
    async (next: LigneConcordance[]) => {
      if (usingConcordanceApi && isConcordancePeriodeApiReady(periodeId)) {
        try {
          const saved = unwrapApiData(
            await AccountingConcordanceService.replaceLignes(
              periodeId,
              mapLignesConcordanceUiToDto(next),
            ),
            'Impossible d\'enregistrer les lignes de concordance.',
          ).map(mapLigneConcordanceDtoToUi);
          setLignesManuelles(saved);
          const calculResponse = await AccountingConcordanceService.getCalcul(periodeId);
          setApiCalcul(unwrapApiData(calculResponse, 'Impossible de recalculer la concordance.'));
          toast.success('Lignes de concordance enregistrées');
          return;
        } catch {
          toast.error('Impossible d\'enregistrer les lignes de concordance');
          throw new Error('save concordance failed');
        }
      }

      setLignesManuelles(next);
      saveLignesConcordance(next);
    },
    [usingConcordanceApi, periodeId],
  );

  const usingApiEcritures =
    !ecrituresMock &&
    ecritures.some((e) => e.statut === 'VALIDEE' && e.exerciceAnalytiqueId === periodeId);

  const loading = periodesLoading || ecrituresLoading || chargesLoading;
  const error = periodesError ?? ecrituresError ?? concordanceError;

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
    usingConcordanceApi,
    usingMockFallback: periodesMock || ecrituresMock || chargesMock || !usingConcordanceApi,
    hasLignesAuto: lignesAuto.length > 0,
    reloadConcordance: () => loadConcordanceApi(periodeId),
  };
}
