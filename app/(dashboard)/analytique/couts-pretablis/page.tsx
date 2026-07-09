"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, ReferenceLine } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { ClipboardCheck, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useCoutsPreetablisApi } from "@/hooks/use-couts-pretablis-api";
import { usePeriodesAnalytiquesAlignees } from "@/hooks/use-periodes-analytiques-alignees";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

export default function CoutsPreetablisPage() {
    const { periodes } = usePeriodesAnalytiquesAlignees();
    const periodeCourante = periodes.find((p) => p.statut === "EN_COURS") ?? periodes[0];
    const { ecarts, loading, error, usingMockFallback } = useCoutsPreetablisApi(periodeCourante?.id);
    const [selectedProd, setSelectedProd] = useState<string>("");

    const selectedId = selectedProd || ecarts[0]?.id || "";
    const data = ecarts.find((e) => e.id === selectedId);

    if (loading) return <CustomPageLoader />;
    if (!data) {
        return (
            <div className="p-6 text-sm text-muted-foreground">
                Aucune fiche de coût standard disponible pour analyser les écarts.
            </div>
        );
    }

    const totalCPreetabli = data.qtePreetablie * (data.coutPreetabli.matieres + data.coutPreetabli.mod + data.coutPreetabli.fap);
    const totalCReel = data.qteReelle * (data.coutReel.matieres + data.coutReel.mod + data.coutReel.fap);
    const ecartGlobal = totalCReel - totalCPreetabli;

    const ecartMatieres = data.qteReelle * data.coutReel.matieres - data.qtePreetablie * data.coutPreetabli.matieres;
    const ecartMod = data.qteReelle * data.coutReel.mod - data.qtePreetablie * data.coutPreetabli.mod;
    const ecartFap = data.qteReelle * data.coutReel.fap - data.qtePreetablie * data.coutPreetabli.fap;

    const chartData = [
        { name: "Matières G.", Ecart: ecartMatieres },
        { name: "M.O.D", Ecart: ecartMod },
        { name: "Frais Prod.", Ecart: ecartFap },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {usingMockFallback && error && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold">Coûts Préétablis et Écarts</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Fiches de coûts standards et analyse des écarts budgétaires (Axe 4)</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {ecarts.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedProd(p.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selectedId === p.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        {p.produitLibelle}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Coût de Production Préétabli", val: totalCPreetabli, icon: ClipboardCheck, color: "bg-indigo-100 text-indigo-600" },
                    { label: "Coût de Production Réel", val: totalCReel, icon: ClipboardCheck, color: "bg-cyan-100 text-cyan-600" },
                    { label: "Écart Global", val: Math.abs(ecartGlobal), icon: ecartGlobal > 0 ? TrendingUp : TrendingDown, color: ecartGlobal > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600", desc: ecartGlobal > 0 ? "Défavorable (Dépassement)" : "Favorable (Économie)" },
                ].map((c) => (
                    <div key={c.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div className={`p-2.5 rounded-xl ${c.color}`}><c.icon className="h-5 w-5" /></div>
                            {c.desc && <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ecartGlobal > 0 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>{c.desc}</span>}
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(c.val)}</p>
                        <p className="text-sm font-medium text-foreground/80">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-bold border-b border-border pb-3 mb-3">Analyse des écarts par composante</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-muted-foreground bg-muted/50">
                                <th className="text-left px-3 py-2">Composante</th>
                                <th className="text-right px-3 py-2">Total Préétabli</th>
                                <th className="text-right px-3 py-2">Total Réel</th>
                                <th className="text-right px-3 py-2">Écart</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: "Matières Premières", preetabli: data.qtePreetablie * data.coutPreetabli.matieres, reel: data.qteReelle * data.coutReel.matieres, ecart: ecartMatieres },
                                { label: "Main-d'oeuvre Directe", preetabli: data.qtePreetablie * data.coutPreetabli.mod, reel: data.qteReelle * data.coutReel.mod, ecart: ecartMod },
                                { label: "Frais de Production", preetabli: data.qtePreetablie * data.coutPreetabli.fap, reel: data.qteReelle * data.coutReel.fap, ecart: ecartFap },
                            ].map((r, idx) => (
                                <tr key={idx} className="border-b border-border/50 hover:bg-secondary/20">
                                    <td className="px-3 py-2.5 font-medium">{r.label}</td>
                                    <td className="px-3 py-2.5 text-right font-mono text-cyan-700">{formatCurrency(r.preetabli)}</td>
                                    <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(r.reel)}</td>
                                    <td className={`px-3 py-2.5 text-right font-mono font-bold ${r.ecart > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                        {r.ecart > 0 ? "+" : ""}{formatCurrency(r.ecart)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-muted/30">
                                <td className="px-3 py-3">Total Global</td>
                                <td className="px-3 py-3 text-right text-cyan-700 font-mono">{formatCurrency(totalCPreetabli)}</td>
                                <td className="px-3 py-3 text-right font-mono">{formatCurrency(totalCReel)}</td>
                                <td className={`px-3 py-3 text-right font-mono ${ecartGlobal > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                    {ecartGlobal > 0 ? "+" : ""}{formatCurrency(ecartGlobal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-bold border-b border-border pb-3 mb-3">Décomposition Visuelle des Écarts</h3>
                    <ChartContainer height={250}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'transparent' }} />
                            <ReferenceLine y={0} stroke="hsl(var(--border))" />
                            <Bar dataKey="Ecart" radius={[4, 4, 4, 4]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.Ecart > 0 ? "hsl(var(--destructive))" : "#10b981"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-500 block"></span> Écart Défavorable ({'>'} 0)</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 block"></span> Écart Favorable (&lt; 0)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
