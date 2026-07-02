"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BudgetVsRealiseView } from "@/components/accounting/budget-vs-realise-view";
import { Button } from "@/components/ui/button";
import { useIsMounted } from "@/hooks/use-is-mounted";
import type { BudgetItem } from "@/components/accounting/budget-list-view";
import { mapBudgetDtoToItem, mapBudgetItemsToLegacy } from "@/lib/accounting/budget-mappers";
import { AccountingBudgetsService } from "@/src/lib2/services/AccountingBudgetsService";
import { cn } from "@/lib/utils";

export default function BudgetVsRealisePage() {
    const mountedRef = useIsMounted();
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadBudgets = useCallback(async () => {
        setIsLoading(true);
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
            if (mountedRef.current) setIsLoading(false);
        }
    }, [mountedRef]);

    useEffect(() => {
        loadBudgets();
    }, [loadBudgets]);

    const legacyBudgets = useMemo(() => mapBudgetItemsToLegacy(budgets), [budgets]);

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
                    <div className="flex items-center gap-2">
                        <Link
                            href="/accounting/budgets"
                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                        >
                            <ExternalLink className="h-4 w-4" /> Suivi budgétaire
                        </Link>
                        <Button variant="outline" onClick={loadBudgets} className="border-slate-300">
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    <BudgetVsRealiseView
                        budgets={legacyBudgets}
                        isLoading={isLoading}
                        onRefresh={loadBudgets}
                    />
                </div>
            </div>
        </div>
    );
}
