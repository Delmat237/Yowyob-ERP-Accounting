"use client";

import { useState, useMemo, useCallback } from "react";
import { mockCoutsProduits } from "@/lib/analytique/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { Activity, RefreshCw } from "lucide-react";

interface ProduitData {
    id: string;
    produit: string;
    produitCode: string;
    CA: number;
    CV: number;
    CV_spec: number;
}

function initData(): ProduitData[] {
    return mockCoutsProduits.map((p) => ({
        id: p.id,
        produit: p.produitLibelle,
        produitCode: p.produitCode,
        CA: Math.round(p.coutRevient * 1.35),
        CV: Math.round(p.coutProduction * 0.85),
        CV_spec: Math.round(p.coutProduction * 0.12),
    }));
}

// ─── Cellule éditable inline ──────────────────────────────────────────────────
function EditableCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    function commit() {
        setEditing(false);
        if (draft !== value) onSave(draft);
    }

    if (editing) {
        return (
            <input
                autoFocus
                type="number"
                className="w-28 border border-primary rounded-lg px-2 py-1 bg-input text-sm text-right font-mono"
                value={draft}
                onChange={(e) => setDraft(Number(e.target.value))}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            />
        );
    }

    return (
        <span
            title="Cliquez pour modifier"
            onClick={() => { setDraft(value); setEditing(true); }}
            className="cursor-pointer hover:underline underline-offset-2 hover:text-primary font-mono"
        >
            {formatCurrency(value)}
        </span>
    );
}

const TABS = ["Direct Costing", "Marge sur Coût Spécifique", "Seuil de Rentabilité"] as const;
type TabType = typeof TABS[number];

export default function CoutsPartielsPage() {
    const [tab, setTab] = useState<TabType>("Direct Costing");
    const [data, setData] = useState<ProduitData[]>(initData);

    const [simPrix, setSimPrix] = useState(50000);
    const [simCV, setSimCV] = useState(30000);
    const [simCF, setSimCF] = useState(() => initData().reduce((s, p) => s + p.CV_spec, 0));

    // ─── Totaux ──────────────────────────────────────────────────────────────
    const caGlobal = useMemo(() => data.reduce((s, p) => s + p.CA, 0), [data]);
    const cvGlobal = useMemo(() => data.reduce((s, p) => s + p.CV, 0), [data]);
    const mcvGlobal = useMemo(() => data.reduce((s, p) => s + (p.CA - p.CV), 0), [data]);
    const cvSpecGlobal = useMemo(() => data.reduce((s, p) => s + p.CV_spec, 0), [data]);
    const CF_COMMUNES = useMemo(
        () => Math.round(mockCoutsProduits.reduce((s, p) => s + p.coutAchat, 0) * 0.1),
        []
    );
    const resultatGlobal = useMemo(() => mcvGlobal - CF_COMMUNES - cvSpecGlobal, [mcvGlobal, CF_COMMUNES, cvSpecGlobal]);
    const tauxMcvGlobal = caGlobal > 0 ? mcvGlobal / caGlobal : 0;
    const seuilCA = tauxMcvGlobal > 0 ? CF_COMMUNES / tauxMcvGlobal : 0;

    const updateField = useCallback(
        (id: string, field: keyof Pick<ProduitData, "CA" | "CV" | "CV_spec">, val: number) => {
            setData((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
        },
        []
    );

    function reinitialiser() {
        const d = initData();
        setData(d);
        setSimCF(d.reduce((s, p) => s + p.CV_spec, 0));
    }

    // Simulation seuil
    const seuilRentabilite = simPrix - simCV > 0 ? simCF / (simPrix - simCV) : 0;
    const simChart = useMemo(() => {
        if (!isFinite(seuilRentabilite) || seuilRentabilite <= 0) return [];
        return Array.from({ length: 7 }).map((_, i) => {
            const q = Math.max(0, seuilRentabilite * (0.2 + i * 0.3));
            return { q: Math.round(q), CA: q * simPrix, CTotal: simCF + q * simCV };
        });
    }, [seuilRentabilite, simPrix, simCV, simCF]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Coûts Partiels</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Direct costing, coût spécifique et seuil de rentabilité (Axe 2)</p>
                </div>
                <button onClick={reinitialiser}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary">
                    <RefreshCw className="h-4 w-4" /> Réinitialiser depuis données réelles
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "CA Total", val: caGlobal, color: "text-emerald-700" },
                    { label: "Charges Variables", val: cvGlobal, color: "text-cyan-700" },
                    { label: "MCV Globale", val: mcvGlobal, color: "text-indigo-700" },
                    { label: "Résultat Analytique", val: resultatGlobal, color: resultatGlobal >= 0 ? "text-emerald-700" : "text-rose-600" },
                ].map((k) => (
                    <div key={k.label} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                        <p className={`text-xl font-bold mt-1 ${k.color}`}>{formatCurrency(k.val)}</p>
                    </div>
                ))}
            </div>

            {/* Onglets */}
            <div className="flex border-b border-border gap-1">
                {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* ── Direct Costing ── */}
            {tab === "Direct Costing" && (
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground italic">Cliquez sur une valeur CA ou CV pour la modifier directement.</p>
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="text-sm font-bold">Compte de Résultat Différentiel (Direct Costing Simple)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-xs">Élément</th>
                                        {data.map((p) => <th key={p.id} className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-xs">{p.produit}</th>)}
                                        <th className="px-4 py-3 text-right font-semibold uppercase text-xs bg-muted text-primary">Global</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/50">
                                        <td className="px-4 py-3 font-medium">Chiffre d&apos;Affaires (CA)</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right"><EditableCell value={p.CA} onSave={(v) => updateField(p.id, "CA", v)} /></td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-muted/30 font-bold">{formatCurrency(caGlobal)}</td>
                                    </tr>
                                    <tr className="border-b border-border/50 text-cyan-700">
                                        <td className="px-4 py-3">Charges Variables (CV)</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right"><EditableCell value={p.CV} onSave={(v) => updateField(p.id, "CV", v)} /></td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-cyan-50/50">{formatCurrency(cvGlobal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-border font-bold">
                                        <td className="px-4 py-3 text-indigo-700">Marge sur Coûts Variables (MCV)</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right font-mono text-indigo-700">{formatCurrency(p.CA - p.CV)}</td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-indigo-50 text-indigo-700">{formatCurrency(mcvGlobal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-border text-rose-700">
                                        <td className="px-4 py-3 font-bold">Charges Fixes Globales (CF)</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right font-mono text-muted-foreground/30">—</td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-rose-50 font-bold">{formatCurrency(CF_COMMUNES + cvSpecGlobal)}</td>
                                    </tr>
                                    <tr className={resultatGlobal >= 0 ? "bg-emerald-50" : "bg-rose-50"}>
                                        <td className={`px-4 py-4 font-bold ${resultatGlobal >= 0 ? "text-emerald-800" : "text-rose-800"}`}>Résultat Analytique</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-4 text-right font-mono text-muted-foreground/30">—</td>)}
                                        <td className={`px-4 py-4 text-right font-mono font-bold text-lg ${resultatGlobal >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(resultatGlobal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Taux MCV par produit */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.map((p) => {
                            const mcv = p.CA - p.CV;
                            const taux = p.CA > 0 ? (mcv / p.CA) * 100 : 0;
                            return (
                                <div key={p.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">{p.produit}</p>
                                    <div className="flex items-end justify-between mt-2">
                                        <div><p className="text-xs text-muted-foreground">MCV</p><p className="text-lg font-bold text-indigo-700">{formatCurrency(mcv)}</p></div>
                                        <div className="text-right"><p className="text-xs text-muted-foreground">Taux MCV</p><p className="text-lg font-bold text-primary">{taux.toFixed(1)}%</p></div>
                                    </div>
                                    <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, taux))}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Marge sur Coût Spécifique ── */}
            {tab === "Marge sur Coût Spécifique" && (
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground italic">Cliquez sur CA, CV ou Coût Spécifique pour modifier inline.</p>
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="text-sm font-bold">Direct Costing Évolué (Coûts Spécifiques)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-xs">Élément</th>
                                        {data.map((p) => <th key={p.id} className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-xs">{p.produit}</th>)}
                                        <th className="px-4 py-3 text-right font-semibold uppercase text-xs bg-muted text-primary">Global</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/50">
                                        <td className="px-4 py-3 font-medium">Chiffre d&apos;Affaires (CA)</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right"><EditableCell value={p.CA} onSave={(v) => updateField(p.id, "CA", v)} /></td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-muted/30 font-bold">{formatCurrency(caGlobal)}</td>
                                    </tr>
                                    <tr className="border-b border-border/50 text-cyan-700">
                                        <td className="px-4 py-3">Charges Variables (CV)</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right"><EditableCell value={p.CV} onSave={(v) => updateField(p.id, "CV", v)} /></td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-cyan-50/50">{formatCurrency(cvGlobal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-border font-bold">
                                        <td className="px-4 py-3 text-indigo-700">Marge sur Coûts Variables (MCV)</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right font-mono text-indigo-700">{formatCurrency(p.CA - p.CV)}</td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-indigo-50 text-indigo-700">{formatCurrency(mcvGlobal)}</td>
                                    </tr>
                                    <tr className="border-b border-border/50 text-amber-700">
                                        <td className="px-4 py-3">Charges Fixes Spécifiques</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right"><EditableCell value={p.CV_spec} onSave={(v) => updateField(p.id, "CV_spec", v)} /></td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-amber-50/50">{formatCurrency(cvSpecGlobal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-border font-bold">
                                        <td className="px-4 py-3 text-violet-700">Marge sur Coûts Spécifiques</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right font-mono text-violet-700">{formatCurrency(p.CA - p.CV - p.CV_spec)}</td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-violet-50 text-violet-700">{formatCurrency(mcvGlobal - cvSpecGlobal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-border text-rose-700">
                                        <td className="px-4 py-3 font-bold">Charges Fixes Communes</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-3 text-right font-mono text-muted-foreground/30">—</td>)}
                                        <td className="px-4 py-3 text-right font-mono bg-rose-50 font-bold">{formatCurrency(CF_COMMUNES)}</td>
                                    </tr>
                                    <tr className={resultatGlobal >= 0 ? "bg-emerald-50" : "bg-rose-50"}>
                                        <td className={`px-4 py-4 font-bold ${resultatGlobal >= 0 ? "text-emerald-800" : "text-rose-800"}`}>Résultat Global</td>
                                        {data.map((p) => <td key={p.id} className="px-4 py-4 text-right font-mono text-muted-foreground/30">—</td>)}
                                        <td className={`px-4 py-4 text-right font-mono font-bold text-lg ${resultatGlobal >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(resultatGlobal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Indicateurs rentabilité par produit */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.map((p) => {
                            const mcs = p.CA - p.CV - p.CV_spec;
                            const rentable = mcs >= 0;
                            return (
                                <div key={p.id} className={`rounded-2xl border p-4 shadow-sm ${rentable ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                                    <p className={`text-xs font-semibold uppercase ${rentable ? "text-emerald-800" : "text-rose-800"}`}>{p.produit}</p>
                                    <p className={`text-xl font-bold mt-1 ${rentable ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(mcs)}</p>
                                    <p className={`text-xs mt-0.5 ${rentable ? "text-emerald-600" : "text-rose-500"}`}>
                                        Marge sur coût spécifique — {rentable ? "Rentable ✓" : "Non rentable ✗"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Seuil de Rentabilité ── */}
            {tab === "Seuil de Rentabilité" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold">Paramètres de simulation</h3>
                            {[
                                { label: "Prix de Vente Unitaire (PV)", val: simPrix, set: setSimPrix },
                                { label: "Coût Variable Unitaire (CVU)", val: simCV, set: setSimCV },
                                { label: "Charges Fixes Totales (CF)", val: simCF, set: setSimCF },
                            ].map(({ label, val, set }) => (
                                <div key={label}>
                                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 block">{label}</label>
                                    <input type="number" className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm"
                                        value={val} onChange={(e) => set(Number(e.target.value))} />
                                </div>
                            ))}
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Seuil de Rentabilité (simulation)</h3>
                            <p className="text-2xl font-bold text-emerald-700 mt-1">
                                {isFinite(seuilRentabilite) && seuilRentabilite > 0 ? Math.ceil(seuilRentabilite).toLocaleString() : "—"} unités
                            </p>
                            <p className="text-sm text-emerald-600 mt-0.5">
                                soit {isFinite(seuilRentabilite) ? formatCurrency(seuilRentabilite * simPrix) : "—"} de CA
                            </p>
                            <div className="mt-3 flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs text-emerald-600">Marge unitaire : {formatCurrency(simPrix - simCV)}</span>
                            </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                            <p className="text-xs font-bold text-indigo-800 uppercase">Seuil (données réelles)</p>
                            <p className="text-lg font-bold text-indigo-700 mt-1">{formatCurrency(seuilCA)}</p>
                            <p className="text-xs text-indigo-600 mt-0.5">
                                CF communes ({formatCurrency(CF_COMMUNES)}) ÷ Taux MCV ({(tauxMcvGlobal * 100).toFixed(1)}%)
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-card border border-border rounded-xl p-4">
                                <p className="text-xs text-muted-foreground">Taux MCV simul.</p>
                                <p className="text-lg font-bold text-indigo-600">{simPrix > 0 ? (((simPrix - simCV) / simPrix) * 100).toFixed(1) : 0}%</p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4">
                                <p className="text-xs text-muted-foreground">Taux MCV réel</p>
                                <p className="text-lg font-bold text-primary">{(tauxMcvGlobal * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <h3 className="text-sm font-bold mb-4">Graphique du Seuil de Rentabilité (Point Mort)</h3>
                        <div className="h-[350px] w-full">
                            {isFinite(seuilRentabilite) && simPrix > simCV && simChart.length > 0 ? (
                                <ChartContainer height={350}>
                                    <LineChart data={simChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="q" tickFormatter={(v) => `${v}u`} tick={{ fontSize: 11 }} />
                                        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Quantité : ${l}`} />
                                        <ReferenceLine x={Math.round(seuilRentabilite)} stroke="hsl(var(--destructive))" strokeDasharray="5 5"
                                            label={{ position: "top", value: "Seuil", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                                        <Line type="monotone" dataKey="CA" name="Chiffre d'Affaires" stroke="#10b981" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="CTotal" name="Coût Total" stroke="#ef4444" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    Paramètres invalides — PV doit être supérieur à CVU
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
