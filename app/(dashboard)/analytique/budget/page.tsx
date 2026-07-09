"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import { BarChart3, ExternalLink, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { BudgetVsRealiseView } from "@/components/accounting/budget-vs-realise-view";
import { useIsMounted } from "@/hooks/use-is-mounted";
import type { BudgetItem } from "@/components/accounting/budget-list-view";
import { mapBudgetDtoToItem, mapBudgetItemsToLegacy } from "@/lib/accounting/budget-mappers";
import { AccountingBudgetsService } from "@/src/lib2/services/AccountingBudgetsService";
import { AccountingFiscalYearsService } from "@/src/lib2/services/AccountingFiscalYearsService";
import type { BudgetVsRealiseDto } from "@/src/lib2/models/BudgetVsRealiseDto";
import { unwrapApiData } from "@/lib/analytique/analytique-api";

interface ExerciceOption {
    id: string;
    libelle: string;
}

export default function BudgetVsRealisePage() {
    const mountedRef = useIsMounted();
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [exercices, setExercices] = useState<ExerciceOption[]>([]);
    const [exerciceId, setExerciceId] = useState<string>("");
    const [vsRealise, setVsRealise] = useState<BudgetVsRealiseDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [vsLoading, setVsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const loadBudgets = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) setIsLoading(true);
        try {
            const response = await AccountingBudgetsService.getAllBudgets();
            if (!mountedRef.current) return;
            if (response.data) {
                setBudgets((response.data ?? []).map(mapBudgetDtoToItem));
            }
        } catch (error) {
            if (!mountedRef.current) return;
            console.error("Failed to load budgets:", error);
            toast.error("Impossible de charger les budgets.");
        } finally {
            if (mountedRef.current && !options?.silent) setIsLoading(false);
        }
    }, [mountedRef]);

    const loadExercices = useCallback(async () => {
        try {
            const response = await AccountingFiscalYearsService.getAllExercices();
            const list = (response.data ?? [])
                .filter((e) => e.id)
                .map((e) => ({
                    id: e.id!,
                    libelle: e.libelle ?? e.code ?? "Exercice",
                }));
            setExercices(list);
            if (!exerciceId && list.length > 0) {
                setExerciceId(list[0].id);
            }
        } catch {
            setApiError("Impossible de charger les exercices.");
        }
    }, [exerciceId]);

    const loadVsRealise = useCallback(async (id: string) => {
        if (!id) return;
        setVsLoading(true);
        setApiError(null);
        try {
            const response = await AccountingBudgetsService.getBudgetVsRealise(id);
            setVsRealise(unwrapApiData(response, "Impossible de charger le comparatif budget vs réalisé."));
        } catch (err: unknown) {
            setVsRealise(null);
            setApiError(
                err instanceof Error ? err.message : "Comparatif budget vs réalisé indisponible.",
            );
        } finally {
            setVsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBudgets();
        void loadExercices();
    }, [loadBudgets, loadExercices]);

    useEffect(() => {
        if (exerciceId) void loadVsRealise(exerciceId);
    }, [exerciceId, loadVsRealise]);

    useAutoRefresh(loadBudgets, [loadBudgets]);

    const legacyBudgets = useMemo(() => mapBudgetItemsToLegacy(budgets), [budgets]);

    const vsLignes = (vsRealise?.lignes ?? []) as Array<{
        noCompte?: string;
        libelleCompte?: string;
        montantBudget?: number;
        montantRealise?: number;
        ecart?: number;
        tauxRealisation?: number;
    }>;

    return (
        <div className="min-h-screen flex flex-col p-4 bg-gray-100">
            <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-xl font-semibold text-gray-700">Budget vs Réalisé</h1>
                        </div>
                        <p className="text-sm text-gray-500">
                            Suivi des montants alloués par rapport aux réalisations — budgets annuels (exercice) et mensuels (période).
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {exercices.length > 0 && (
                            <select
                                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                                value={exerciceId}
                                onChange={(e) => setExerciceId(e.target.value)}
                            >
                                {exercices.map((ex) => (
                                    <option key={ex.id} value={ex.id}>{ex.libelle}</option>
                                ))}
                            </select>
                        )}
                        <Link
                            href="/accounting/budgets"
                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                        >
                            <ExternalLink className="h-4 w-4" /> Suivi budgétaire
                        </Link>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {apiError && (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{apiError}</span>
                        </div>
                    )}

                    {vsRealise && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {[
                                { label: "Budget total", value: vsRealise.totalBudget ?? 0, icon: BarChart3 },
                                { label: "Réalisé", value: vsRealise.totalRealise ?? 0, icon: TrendingUp },
                                {
                                    label: "Écart",
                                    value: vsRealise.totalEcart ?? 0,
                                    icon: (vsRealise.totalEcart ?? 0) >= 0 ? TrendingDown : TrendingUp,
                                },
                                {
                                    label: "Taux réalisation",
                                    value: `${(vsRealise.tauxRealisation ?? 0).toFixed(1)} %`,
                                    raw: true,
                                    icon: BarChart3,
                                },
                            ].map((kpi) => (
                                <div key={kpi.label} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">{kpi.label}</p>
                                    <p className="text-lg font-bold text-slate-800 mt-1">
                                        {kpi.raw ? kpi.value : formatCurrency(kpi.value as number)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {vsLignes.length > 0 && (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700">
                                Détail comparatif API {vsLoading ? "— chargement…" : ""}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-slate-500 border-b">
                                            <th className="px-4 py-2">Compte</th>
                                            <th className="px-4 py-2 text-right">Budget</th>
                                            <th className="px-4 py-2 text-right">Réalisé</th>
                                            <th className="px-4 py-2 text-right">Écart</th>
                                            <th className="px-4 py-2 text-right">Taux</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vsLignes.map((l, i) => (
                                            <tr key={i} className="border-b border-slate-100 last:border-0">
                                                <td className="px-4 py-2">
                                                    <span className="font-mono text-xs">{l.noCompte}</span>
                                                    <span className="ml-2">{l.libelleCompte}</span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono">{formatCurrency(l.montantBudget ?? 0)}</td>
                                                <td className="px-4 py-2 text-right font-mono">{formatCurrency(l.montantRealise ?? 0)}</td>
                                                <td className="px-4 py-2 text-right font-mono">{formatCurrency(l.ecart ?? 0)}</td>
                                                <td className="px-4 py-2 text-right">{(l.tauxRealisation ?? 0).toFixed(1)} %</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <BudgetVsRealiseView
                        budgets={legacyBudgets}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
