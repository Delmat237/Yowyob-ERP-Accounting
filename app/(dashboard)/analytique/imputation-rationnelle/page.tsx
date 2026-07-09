"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { AlertTriangle, Calculator, Activity, AlertCircle } from "lucide-react";
import { useCoutsAnalytiquesApi } from "@/hooks/use-couts-analytiques-api";
import { computeImputationRow } from "@/lib/analytique/couts-calculs";
import type { LigneImputationRationnelle } from "@/lib/analytique/couts-calculs";
import { saveImputationRows } from "@/lib/analytique/methodes-couts-store";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

export default function ImputationRationnellePage() {
    const {
        periodes,
        periodeId,
        setPeriodeId,
        imputationRows,
        loading,
        error,
        usingApiEcritures,
        usingMockFallback,
    } = useCoutsAnalytiquesApi();

    const [data, setData] = useState<LigneImputationRationnelle[]>([]);

    useEffect(() => {
        setData(imputationRows);
    }, [imputationRows]);

    const persist = (rows: LigneImputationRationnelle[]) => {
        setData(rows);
        saveImputationRows(rows);
    };

    const updateRow = (centreId: string, field: "actNormale" | "actReelle", value: number) => {
        persist(data.map((r) => (r.centreId === centreId ? { ...r, [field]: value } : r)));
    };

    const processedData = data.map(computeImputationRow);
    const totalDiff = processedData.reduce((s, r) => s + r.diff, 0);

    const chartData = processedData.map((r) => ({
        name: r.centre,
        "Charges fixes imputées": r.cfImputees,
        "Charges fixes réelles": r.chFixes,
        "Activité": r.coeff * 100,
    }));

    if (loading && data.length === 0) {
        return <CustomPageLoader message="Chargement de l'imputation rationnelle..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {(error || usingMockFallback) && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        {error ?? "Mode démonstration."}
                        {usingApiEcritures
                            ? " Charges fixes calculées depuis les écritures validées."
                            : " Saisissez les charges fixes manuellement ou validez des écritures."}
                    </span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Imputation Rationnelle des Charges Fixes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Neutralisation de l&apos;impact des variations d&apos;activité selon le taux d&apos;activité normale (Axe 3)
                    </p>
                </div>
                {periodes.length > 0 && (
                    <select
                        className="text-sm border border-border rounded-xl px-3 py-2 bg-card"
                        value={periodeId}
                        onChange={(e) => setPeriodeId(e.target.value)}
                    >
                        {periodes.map((p) => (
                            <option key={p.id} value={p.id}>{p.libelle}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 border-b border-border bg-indigo-50/50 flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-indigo-900">Tableau d&apos;Imputation Rationnelle</h3>
                    </div>
                    <div className="overflow-x-auto flex-1 p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Centre</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Activité normale</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Activité réelle</th>
                                    <th className="px-4 py-3 text-center font-semibold text-indigo-600">Coeff. (AR/AN)</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Charges fixes réelles</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Charges fixes imputées</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map((row) => (
                                    <tr key={row.centreId} className="border-b border-border/50 hover:bg-secondary/20">
                                        <td className="px-4 py-3 font-medium">{row.centre}</td>
                                        <td className="px-4 py-3 text-right">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-20 text-right border border-border rounded-lg px-2 py-1 text-sm"
                                                value={row.actNormale}
                                                onChange={(e) => updateRow(row.centreId, "actNormale", Number(e.target.value) || 1)}
                                            />
                                            <span className="text-xs text-muted-foreground ml-1">{row.unite}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-20 text-right border border-cyan-200 rounded-lg px-2 py-1 text-sm font-medium text-cyan-700"
                                                value={row.actReelle}
                                                onChange={(e) => updateRow(row.centreId, "actReelle", Number(e.target.value) || 0)}
                                            />
                                            <span className="text-xs text-muted-foreground ml-1">{row.unite}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.coeff < 1 ? "bg-amber-100 text-amber-700" : row.coeff > 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                                                {(row.coeff * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(row.chFixes)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-indigo-700 font-medium">{formatCurrency(row.cfImputees)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-muted/30 p-4 border-t border-border flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-indigo-600" />
                            <span className="font-medium">Écart global (sous-activité / suractivité)</span>
                        </div>
                        <span className={`font-bold font-mono ${totalDiff > 0 ? "text-amber-700" : totalDiff < 0 ? "text-emerald-700" : "text-slate-700"}`}>
                            {formatCurrency(totalDiff)}
                        </span>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Visualisation des écarts d&apos;activité
                    </h3>
                    <ChartContainer height={288} className="h-72">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                            <Legend />
                            <ReferenceLine y={0} stroke="#94a3b8" />
                            <Bar dataKey="Charges fixes imputées" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Charges fixes réelles" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
}
