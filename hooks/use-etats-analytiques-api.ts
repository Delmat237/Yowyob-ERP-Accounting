'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePeriodesAnalytiquesAlignees } from '@/hooks/use-periodes-analytiques-alignees';
import { useCentresAnalyseApi } from '@/hooks/use-centres-analyse-api';
import { useEcrituresAnalytiquesApi } from '@/hooks/use-ecritures-analytiques-api';
import { useChargesVentilees } from '@/hooks/use-charges-ventilees';
import {
  buildRepartitionCentres,
  calcProduitsFromMock,
} from '@/lib/analytique/analytique-aggregations';
import {
  buildLignesAutoFromCharges,
  computeConcordance,
  mergeLignesConcordance,
} from '@/lib/analytique/concordance-calculs';
import {
  isConcordancePeriodeApiReady,
  mergeConcordanceApiWithLocal,
} from '@/lib/analytique/concordance-api-merge';
import { enrichCoutsProduits } from '@/lib/analytique/couts-calculs';
import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapLigneConcordanceDtoToUi } from '@/lib/analytique/analytique-mappers';
import {
  mockCoutsProduits,
  mockChargesVentilees,
  type PeriodeAnalytique,
  type LigneConcordance,
} from '@/lib/analytique/mock-data';
import { listChargesVentilees } from '@/lib/analytique/charges-ventilees-store';
import { listLignesConcordance } from '@/lib/analytique/methodes-couts-store';
import { AccountingConcordanceService } from '@/src/lib2/services/AccountingConcordanceService';
import type { ConcordanceCalculDto } from '@/src/lib2/models/ConcordanceCalculDto';

export function useEtatsAnalytiquesApi() {
  const {
    periodes,
    periodesCG,
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
  const { charges, loading: chargesLoading, usingMockFallback: chargesMock } = useChargesVentilees();

  const [periodeId, setPeriodeId] = useState<string>('');
  const [lignesManuelles, setLignesManuelles] = useState<LigneConcordance[]>(() =>
    listLignesConcordance(),
  );
  const [apiCalcul, setApiCalcul] = useState<ConcordanceCalculDto | null>(null);
  const [usingConcordanceApi, setUsingConcordanceApi] = useState(false);

  useEffect(() => {
    if (periodes.length === 0 || periodeId) return;
    const enCours = periodes.find((p) => p.statut === 'EN_COURS');
    const ouvert = periodes.find((p) => p.statut === 'OUVERT');
    setPeriodeId(enCours?.id ?? ouvert?.id ?? periodes[0]?.id ?? '');
  }, [periodes, periodeId]);

  useEffect(() => {
    if (!periodeId || !isConcordancePeriodeApiReady(periodeId)) {
      setUsingConcordanceApi(false);
      setApiCalcul(null);
      setLignesManuelles(listLignesConcordance());
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const data = unwrapApiData(
          await AccountingConcordanceService.getPeriode(periodeId),
          'Impossible de charger la concordance.',
        );
        if (cancelled) return;
        setLignesManuelles(
          (data.lignesManuelles ?? data.calcul?.lignesManuelles ?? []).map(
            mapLigneConcordanceDtoToUi,
          ),
        );
        setApiCalcul(data.calcul ?? null);
        setUsingConcordanceApi(true);
      } catch {
        if (cancelled) return;
        setUsingConcordanceApi(false);
        setApiCalcul(null);
        setLignesManuelles(listLignesConcordance());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [periodeId]);

  const selectedPeriode: PeriodeAnalytique | undefined =
    periodes.find((p) => p.id === periodeId) ?? periodes[0];

  const chargesEffectives =
    charges.length > 0 ? charges : typeof window !== 'undefined' ? listChargesVentilees() : mockChargesVentilees;

  const repartition = useMemo(
    () => buildRepartitionCentres(ecritures, chargesEffectives, centres, periodeId),
    [ecritures, chargesEffectives, centres, periodeId],
  );

  const repartitionMock = useMemo(() => {
    const parCentre: Record<string, number> = {};
    for (const charge of mockChargesVentilees.filter(
      (cv) => cv.periodeId === periodeId && cv.incorporable,
    )) {
      for (const v of charge.ventilations) {
        parCentre[v.centreId] =
          (parCentre[v.centreId] ?? 0) + (charge.montantTotal * v.pourcentage) / 100;
      }
    }
    return centres
      .filter((c) => c.actif)
      .map((c) => ({
        id: c.id,
        libelle: c.libelle,
        nature: c.nature,
        uniteOeuvre: c.uniteOeuvre,
        montant: Math.round(parCentre[c.id] ?? 0),
      }))
      .filter((c) => c.montant > 0);
  }, [centres, periodeId]);

  const repartitionFinale = repartition.length > 0 ? repartition : repartitionMock;

  const produitsApi = useMemo(
    () => calcProduitsFromMock(mockCoutsProduits, periodeId),
    [periodeId],
  );

  const lignesAuto = useMemo(() => {
    if (usingConcordanceApi && apiCalcul?.lignesAuto) {
      return apiCalcul.lignesAuto.map(mapLigneConcordanceDtoToUi);
    }
    return buildLignesAutoFromCharges(chargesEffectives, periodeId);
  }, [usingConcordanceApi, apiCalcul, chargesEffectives, periodeId]);

  const lignesConcordance = useMemo(() => {
    if (usingConcordanceApi && apiCalcul?.lignes) {
      return apiCalcul.lignes.map(mapLigneConcordanceDtoToUi);
    }
    return mergeLignesConcordance(lignesManuelles, lignesAuto);
  }, [usingConcordanceApi, apiCalcul, lignesManuelles, lignesAuto]);

  const produitsEnrichis = useMemo(
    () => enrichCoutsProduits(mockCoutsProduits, ecritures, periodeId),
    [ecritures, periodeId],
  );

  const concordanceLocal = useMemo(
    () =>
      computeConcordance({
        periode: selectedPeriode,
        periodesCG,
        charges: chargesEffectives,
        ecritures,
        produits: produitsEnrichis,
        lignes: lignesConcordance,
        periodeId,
      }),
    [
      selectedPeriode,
      periodesCG,
      chargesEffectives,
      ecritures,
      produitsEnrichis,
      lignesConcordance,
      periodeId,
    ],
  );

  const concordanceMerged = useMemo(
    () => mergeConcordanceApiWithLocal(concordanceLocal, apiCalcul, lignesConcordance),
    [concordanceLocal, apiCalcul, lignesConcordance],
  );

  const concordance = useMemo(
    () => ({
      periodeCG: concordanceMerged.periodeCG,
      resultatCG: concordanceMerged.resultCG,
      totalChargesCG: concordanceMerged.totalChargesCG,
      totalProduitsCG: concordanceMerged.totalProduitsCG,
      chargesNonInc: concordanceMerged.totalNonInc,
      ajustements: concordanceMerged.sommeDiff,
      lignes: lignesConcordance,
      resultatCA: concordanceMerged.resultCA,
      concordanceOk: concordanceMerged.concordanceOk,
      ecartVerif: concordanceMerged.ecartVerif,
    }),
    [concordanceMerged, lignesConcordance],
  );

  const usingApiEcritures = !ecrituresMock && ecritures.some((e) => e.statut === 'VALIDEE');
  const loading = periodesLoading || centresLoading || ecrituresLoading || chargesLoading;
  const error = periodesError ?? centresError ?? ecrituresError;

  return {
    periodes,
    periodeId,
    setPeriodeId,
    selectedPeriode,
    produits: produitsApi,
    repartition: repartitionFinale,
    concordance,
    loading,
    error,
    usingApiEcritures,
    usingConcordanceApi,
    usingMockFallback: periodesMock || ecrituresMock || chargesMock || !usingConcordanceApi,
    ecrituresValideesCount: ecritures.filter(
      (e) => e.statut === 'VALIDEE' && e.exerciceAnalytiqueId === periodeId,
    ).length,
  };
}
