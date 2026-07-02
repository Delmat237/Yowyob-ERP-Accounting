"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountingAnalyticsService } from "@/src/lib2/services/AccountingAnalyticsService";
import type { AxeAnalytiqueDto } from "@/src/lib2/models/AxeAnalytiqueDto";
import type { AxeAnalytique, TypeAxe } from "@/lib/analytique/mock-data";

function mapDtoToAxe(dto: AxeAnalytiqueDto): AxeAnalytique {
  return {
    id: dto.id ?? "",
    code: dto.code ?? "",
    libelle: dto.libelle ?? dto.code ?? "",
    type: (dto.type as TypeAxe) ?? "PRINCIPAL",
    actif: dto.actif ?? true,
  };
}

/**
 * Charge les axes analytiques (API existante) avec repli sur les données mock.
 */
export function useAxesAnalytiques() {
  const [axes, setAxes] = useState<AxeAnalytique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockFallback(false);
    try {
      const response = await AccountingAnalyticsService.getAllAxes();
      if (response?.success === false) {
        throw new Error(response.message || "Impossible de charger les axes analytiques.");
      }
      const list = (response?.data ?? [])
        .map(mapDtoToAxe)
        .filter((a) => a.id && a.actif)
        .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
      if (list.length === 0) {
        throw new Error("Aucun axe analytique disponible.");
      }
      setAxes(list);
    } catch (err: unknown) {
      const { mockAxes } = await import("@/lib/analytique/mock-data");
      setAxes(mockAxes.filter((a) => a.actif));
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

  return { axes, loading, error, usingMockFallback, reload: load };
}
