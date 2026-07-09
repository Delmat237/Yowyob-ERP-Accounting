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
import { enrichCoutsProduits } from '@/lib/analytique/couts-calculs';
import {
  mockCoutsProduits,
  mockChargesVentilees,
  type PeriodeAnalytique,
} from '@/lib/analytique/mock-data';
import { listChargesVentilees } from '@/lib/analytique/charges-ventilees-store';
import { listLignesConcordance } from '@/lib/analytique/methodes-couts-store';

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
  const { charges, loading: chargesLoading } = useChargesVentilees();

  const [periodeId, setPeriodeId] = useState<string>('');

  useEffect(() => {
    if (periodes.length === 0 || periodeId) return;
    const enCours = periodes.find((p) => p.statut === 'EN_COURS');
    const ouvert = periodes.find((p) => p.statut === 'OUVERT');
    setPeriodeId(enCours?.id ?? ouvert?.id ?? periodes[0]?.id ?? '');
  }, [periodes, periodeId]);

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

  const lignesManuelles = useMemo(() => listLignesConcordance(), []);

  const lignesAuto = useMemo(
    () => buildLignesAutoFromCharges(chargesEffectives, periodeId),
    [chargesEffectives, periodeId],
  );

  const lignesConcordance = useMemo(
    () => mergeLignesConcordance(lignesManuelles, lignesAuto),
    [lignesManuelles, lignesAuto],
  );

  const produitsEnrichis = useMemo(
    () => enrichCoutsProduits(mockCoutsProduits, ecritures, periodeId),
    [ecritures, periodeId],
  );

  const concordance = useMemo(() => {
    const computed = computeConcordance({
      periode: selectedPeriode,
      periodesCG,
      charges: chargesEffectives,
      ecritures,
      produits: produitsEnrichis,
      lignes: lignesConcordance,
      periodeId,
    });
    return {
      periodeCG: computed.periodeCG,
      resultatCG: computed.resultCG,
      totalChargesCG: computed.totalChargesCG,
      totalProduitsCG: computed.totalProduitsCG,
      chargesNonInc: computed.totalNonInc,
      ajustements: computed.sommeDiff,
      lignes: lignesConcordance,
      resultatCA: computed.resultCA,
      concordanceOk: computed.concordanceOk,
      ecartVerif: computed.ecartVerif,
    };
  }, [
    selectedPeriode,
    periodesCG,
    chargesEffectives,
    ecritures,
    produitsEnrichis,
    lignesConcordance,
    periodeId,
  ]);

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
    usingMockFallback: periodesMock || ecrituresMock,
    ecrituresValideesCount: ecritures.filter(
      (e) => e.statut === 'VALIDEE' && e.exerciceAnalytiqueId === periodeId,
    ).length,
  };
}
