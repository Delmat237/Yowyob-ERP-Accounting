"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { AlertTriangle, Calculator, Activity } from "lucide-react";

const activiteData = [
    { centre: "Production", unite: "H.Mod", actNormale: 1000, actReelle: 800, chFixes: 500000 },
    { centre: "Distribution", unite: "Cmds", actNormale: 500, actReelle: 600, chFixes: 300000 },
    { centre: "Admin", unite: "Employés", actNormale: 50, actReelle: 50, chFixes: 400000 },
];

export default function ImputationRationnellePage() {
    const [data, setData] = useState(activiteData);

    const calculateRow = (row: typeof activiteData[0]) => {
        const coeff = row.actReelle / row.actNormale;
        const cfImputees = row.chFixes * coeff;
        const diff = row.chFixes - cfImputees;
        // diff > 0 => coût de chômage / sous-activité
        // diff < 0 => boni de suractivité
        return { ...row, coeff, cfImputees, diff };
    };

    const processedData = data.map(calculateRow);
    const totalDiff = processedData.reduce((s, r) => s + r.diff, 0);

    const chartData = processedData.map(r => ({
        name: r.centre,
        "CF Imputées": r.cfImputees,
        "CF Réelles": r.chFixes,
        "Activité": r.coeff * 100
    }));

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">Imputation Rationnelle des Charges Fixes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Neutralisation de l&apos;impact des variations d&apos;activité selon le taux d&apos;activité normale (Axe 3)</p>
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
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Activité N.</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Activité R.</th>
                                    <th className="px-4 py-3 text-center font-semibold text-indigo-600">Coeff. (AR/AN)</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">CF Réelles</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">CF Imputées</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map((row, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                                        <td className="px-4 py-3 font-medium">{row.centre}</td>
                                        <td className="px-4 py-3 text-right">{row.actNormale} {row.unite}</td>
                                        <td className="px-4 py-3 text-right font-medium text-cyan-700">{row.actReelle} {row.unite}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.coeff < 1 ? 'bg-amber-100 text-amber-700' : row.coeff > 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
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
                        <span className="text-sm font-bold text-foreground">Différence d&apos;incorporation totale :</span>
                        <div className="text-right">
                            {totalDiff > 0 ? (
                                <div>
                                    <span className="text-lg font-bold text-rose-600">{formatCurrency(totalDiff)}</span>
                                    <p className="text-xs text-rose-500 font-medium">Coût de chômage (Sous-activité globale)</p>
                                </div>
                            ) : totalDiff < 0 ? (
                                <div>
                                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(Math.abs(totalDiff))}</span>
                                    <p className="text-xs text-emerald-500 font-medium">Boni de suractivité globale</p>
                                </div>
                            ) : (
                                <span className="text-lg font-bold text-slate-600">{formatCurrency(0)}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-6">
                    <h3 className="text-sm font-bold text-foreground">Comparaison CF Réelles vs CF Imputées</h3>
                    <ChartContainer height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                            <RechartsTooltip formatter={(val: number | string, name: string) => [name.includes('Activité') ? `${val}%` : formatCurrency(val as number), name]} />
                            <Legend />
                            <Bar dataKey="CF Réelles" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.6} />
                            <Bar dataKey="CF Imputées" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
}
