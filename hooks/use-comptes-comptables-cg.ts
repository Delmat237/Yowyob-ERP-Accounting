"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountingComptesService } from "@/src/lib2";
import type { CompteDto } from "@/src/lib2/models/CompteDto";

/** Classes CG éligibles au miroir classe 90 (charges et produits). */
const DEFAULT_CG_CLASSES = [6, 7];

type UseComptesComptablesCGOptions = {
  /** Filtrer par classes OHADA CG (défaut : 6 et 7). */
  classes?: number[];
};

/**
 * Charge les comptes comptables CG (pas le plan comptable référentiel).
 * Endpoint : GET /api/accounting/comptes
 */
export function useComptesComptablesCG(options?: UseComptesComptablesCGOptions) {
  const classes = options?.classes ?? DEFAULT_CG_CLASSES;
  const classFilterKey = classes.join(",");
  const [accounts, setAccounts] = useState<CompteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AccountingComptesService.getAllComptes();
      if (response?.success === false) {
        throw new Error(response.message || "Impossible de charger les comptes comptables.");
      }
      const data = (response?.data ?? [])
        .filter((account) => account.actif !== false)
        .filter((account) => {
          const classe =
            account.classe ?? Number.parseInt(account.noCompte?.charAt(0) ?? "", 10);
          return classes.includes(classe);
        })
        .sort((a, b) => a.noCompte.localeCompare(b.noCompte, undefined, { numeric: true }));
      setAccounts(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Impossible de charger les comptes comptables.";
      setError(message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [classFilterKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, loading, error, reload: load };
}

/** @deprecated Utiliser useComptesComptablesCG */
export const usePlanComptableCG = useComptesComptablesCG;
