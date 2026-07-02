"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AccountingFiscalYearsService,
  AccountingPeriodsService,
} from "@/src/lib2";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import type { ExerciceComptableDto } from "@/src/lib2/models/ExerciceComptableDto";
import type { PeriodeAnalytique, StatutPeriode, PeriodeCG, ExerciceCG } from "@/lib/analytique/mock-data";
import {
  deriveStatutPeriodeAnalytique,
  libellePeriodeFromCode,
  mapExerciceComptableToCG,
  mapPeriodeCGToAnalytique,
} from "@/lib/analytique/periodes-alignees";

type UsePeriodesAnalytiquesAligneesResult = {
  periodes: PeriodeAnalytique[];
  periodesCG: PeriodeCG[];
  exercices: ExerciceComptableDto[];
  loading: boolean;
  error: string | null;
  usingMockFallback: boolean;
  reload: () => Promise<void>;
  setStatutLocal: (periodeId: string, statut: StatutPeriode) => void;
  synchroniserClotures: () => void;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const [periodesRes, exercicesRes] = await Promise.all([
        AccountingPeriodsService.getAllPeriodeComptables(),
        AccountingFiscalYearsService.getAllExercices(),
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
      setStatutOverrides({});
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const periodesBase = useMemo(
    () => periodesCG.map((cg) => mapPeriodeCGToAnalytique(cg)),
    [periodesCG],
  );

  const periodes = useMemo(
    () => applyStatutOverrides(periodesBase, statutOverrides),
    [periodesBase, statutOverrides],
  );

  const setStatutLocal = useCallback((periodeId: string, statut: StatutPeriode) => {
    setStatutOverrides((prev) => ({ ...prev, [periodeId]: statut }));
  }, []);

  const synchroniserClotures = useCallback(() => {
    setStatutOverrides((prev) => {
      const next = { ...prev };
      for (const cg of periodesCG) {
        if (!cg.id) continue;
        if (cg.cloturee) {
          next[cg.id] = "CLOTURE";
        } else if (next[cg.id] === "CLOTURE") {
          delete next[cg.id];
        }
      }
      return next;
    });
  }, [periodesCG]);

  return {
    periodes,
    periodesCG,
    exercices,
    loading,
    error,
    usingMockFallback,
    reload: load,
    setStatutLocal,
    synchroniserClotures,
  };
}

export { mapExerciceComptableToCG, deriveStatutPeriodeAnalytique };
