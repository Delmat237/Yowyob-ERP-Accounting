"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import {
  AccountingFiscalYearsService,
  AccountingPeriodsService,
} from "@/src/lib2";
import { AccountingPeriodesAnalytiquesService } from "@/src/lib2/services/AccountingPeriodesAnalytiquesService";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import type { ExerciceComptableDto } from "@/src/lib2/models/ExerciceComptableDto";
import type { PeriodeAnalytiqueDto } from "@/src/lib2/models/PeriodeAnalytiqueDto";
import type { PeriodeAnalytique, StatutPeriode, PeriodeCG, ExerciceCG } from "@/lib/analytique/mock-data";
import {
  deriveStatutPeriodeAnalytique,
  libellePeriodeFromCode,
  mapExerciceComptableToCG,
  mapPeriodeCGToAnalytique,
} from "@/lib/analytique/periodes-alignees";
import {
  mapPeriodeCGToDto,
  mapPeriodeDtoToStatutOverrides,
  mapStatutUiToApi,
} from "@/lib/analytique/analytique-mappers";

type UsePeriodesAnalytiquesAligneesResult = {
  periodes: PeriodeAnalytique[];
  periodesCG: PeriodeCG[];
  exercices: ExerciceComptableDto[];
  loading: boolean;
  error: string | null;
  usingMockFallback: boolean;
  usingApiPeriodes: boolean;
  reload: (options?: AutoRefreshOptions) => Promise<void>;
  setStatutLocal: (periodeId: string, statut: StatutPeriode) => Promise<void>;
  synchroniserClotures: () => Promise<void>;
};

function mapDtoToPeriodeCG(p: PeriodeComptableDto): PeriodeCG {
  return {
    id: p.id ?? p.code,
    code: p.code,
    libelle: libellePeriodeFromCode(p.code),
    dateDebut: p.dateDebut,
    dateFin: p.dateFin,
    cloturee: p.cloturee,
    exerciceCGId: p.exercice_id ?? "",
    resultatNet: 0,
    totalChargesCG: 0,
    totalProduitsCG: 0,
  };
}

function applyStatutOverrides(
  periodes: PeriodeAnalytique[],
  overrides: Record<string, StatutPeriode>,
): PeriodeAnalytique[] {
  return periodes.map((p) => ({
    ...p,
    statut: overrides[p.id] ?? p.statut,
  }));
}

/**
 * Périodes analytiques alignées 1:1 sur les périodes comptables (API CG).
 * L'exercice analytique est l'exercice comptable (exercice_id).
 */
export function usePeriodesAnalytiquesAlignees(): UsePeriodesAnalytiquesAligneesResult {
  const [periodesCG, setPeriodesCG] = useState<PeriodeCG[]>([]);
  const [exercices, setExercices] = useState<ExerciceComptableDto[]>([]);
  const [statutOverrides, setStatutOverrides] = useState<Record<string, StatutPeriode>>({});
  const [periodesApi, setPeriodesApi] = useState<PeriodeAnalytiqueDto[]>([]);
  const [usingApiPeriodes, setUsingApiPeriodes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    setUsingMockFallback(false);
    try {
      const [periodesRes, exercicesRes, periodesAnalytiquesRes] = await Promise.all([
        AccountingPeriodsService.getAllPeriodeComptables(),
        AccountingFiscalYearsService.getAllExercices(),
        AccountingPeriodesAnalytiquesService.getAllPeriodes().catch(() => ({ data: [] })),
      ]);

      if (periodesRes?.success === false) {
        throw new Error(periodesRes.message || "Impossible de charger les périodes.");
      }
      if (exercicesRes?.success === false) {
        throw new Error(exercicesRes.message || "Impossible de charger les exercices.");
      }

      const periodesList = (periodesRes?.data ?? []).sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true }),
      );

      if (periodesList.length === 0) {
        throw new Error("Aucune période comptable disponible.");
      }

      setPeriodesCG(periodesList.map(mapDtoToPeriodeCG));
      setExercices(exercicesRes?.data ?? []);

      const apiPeriodes = periodesAnalytiquesRes?.data ?? [];
      setPeriodesApi(apiPeriodes);
      setUsingApiPeriodes(apiPeriodes.length > 0);
      setStatutOverrides(mapPeriodeDtoToStatutOverrides(apiPeriodes));
    } catch (err: unknown) {
      const { mockPeriodes, mockPeriodesCG, mockExercicesCG } = await import(
        "@/lib/analytique/mock-data"
      );
      setPeriodesCG(mockPeriodesCG);
      setExercices(
        mockExercicesCG.map((e) => ({
          id: e.id,
          code: e.code,
          libelle: e.libelle,
          date_debut: e.dateDebut,
          date_fin: e.dateFin,
          cloture: e.cloture,
          statut: e.statut,
        })),
      );
      setPeriodesApi([]);
      setUsingApiPeriodes(false);
      setStatutOverrides(
        Object.fromEntries(mockPeriodes.map((p) => [p.id, p.statut])),
      );
      setUsingMockFallback(true);
      setError(
        err instanceof Error
          ? `${err.message} — affichage des données de démonstration.`
          : "API indisponible — affichage des données de démonstration.",
      );
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(load, [load]);

  const periodesBase = useMemo(
    () => periodesCG.map((cg) => mapPeriodeCGToAnalytique(cg)),
    [periodesCG],
  );

  const periodes = useMemo(
    () => applyStatutOverrides(periodesBase, statutOverrides),
    [periodesBase, statutOverrides],
  );

  const setStatutLocal = useCallback(
    async (periodeId: string, statut: StatutPeriode) => {
      setStatutOverrides((prev) => ({ ...prev, [periodeId]: statut }));

      if (!usingApiPeriodes || usingMockFallback) return;

      const cg = periodesCG.find((p) => p.id === periodeId);
      const existing = periodesApi.find((p) => p.id === periodeId || p.code === cg?.code);
      if (!cg) return;

      const payload = {
        ...(existing ?? mapPeriodeCGToDto(cg, statut)),
        statut: mapStatutUiToApi(statut),
      };

      if (existing?.id) {
        await AccountingPeriodesAnalytiquesService.updatePeriode(existing.id, payload);
      } else {
        await AccountingPeriodesAnalytiquesService.createPeriode(mapPeriodeCGToDto(cg, statut));
      }
    },
    [periodesApi, periodesCG, usingApiPeriodes, usingMockFallback],
  );

  const synchroniserClotures = useCallback(async () => {
    const nextOverrides: Record<string, StatutPeriode> = { ...statutOverrides };
    for (const cg of periodesCG) {
      if (!cg.id) continue;
      if (cg.cloturee) {
        nextOverrides[cg.id] = "CLOTURE";
      } else if (nextOverrides[cg.id] === "CLOTURE") {
        delete nextOverrides[cg.id];
      }
    }
    setStatutOverrides(nextOverrides);

    if (!usingApiPeriodes || usingMockFallback) return;

    await Promise.all(
      periodesCG
        .filter((cg) => cg.id && cg.cloturee)
        .map(async (cg) => {
          const existing = periodesApi.find((p) => p.id === cg.id || p.code === cg.code);
          const payload = {
            ...(existing ?? mapPeriodeCGToDto(cg, "CLOTURE")),
            statut: "CLOTUREE",
          };
          if (existing?.id) {
            await AccountingPeriodesAnalytiquesService.updatePeriode(existing.id, payload);
          } else {
            await AccountingPeriodesAnalytiquesService.createPeriode(mapPeriodeCGToDto(cg, "CLOTURE"));
          }
        }),
    );
    await load({ silent: true });
  }, [load, periodesApi, periodesCG, statutOverrides, usingApiPeriodes, usingMockFallback]);

  return {
    periodes,
    periodesCG,
    exercices,
    loading,
    error,
    usingMockFallback,
    usingApiPeriodes,
    reload: load,
    setStatutLocal,
    synchroniserClotures,
  };
}

export { mapExerciceComptableToCG, deriveStatutPeriodeAnalytique };
