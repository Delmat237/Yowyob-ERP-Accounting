"use client";

import { useState } from "react";
import { mockCentres, mockCharges } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

// Répartition matrix: charges indirectes × centres
const NATURES = ["Électricité", "Amortissements", "Frais généraux", "Entretien/Réparations"];
const PRINCIPAL_CENTRES = ["Production", "Distribution", "Administration"];
const AUX_CENTRES = ["Entretien", "Logistique"];

type Matrix = Record<string, Record<string, number>>;

const initPrimaire: Matrix = {
    "Électricité": { "Production": 60, "Distribution": 20, "Administration": 10, "Entretien": 5, "Logistique": 5 },
    "Amortissements": { "Production": 70, "Distribution": 10, "Administration": 15, "Entretien": 5, "Logistique": 0 },
    "Frais généraux": { "Production": 40, "Distribution": 25, "Administration": 30, "Entretien": 5, "Logistique": 0 },
    "Entretien/Réparations": { "Production": 50, "Distribution": 20, "Administration": 20, "Entretien": 10, "Logistique": 0 },
};

const initSecondaire: Matrix = {
    "Entretien": { "Production": 60, "Distribution": 30, "Administration": 10 },
    "Logistique": { "Production": 50, "Distribution": 40, "Administration": 10 },
};

const TOTAUX: Record<string, number> = {
    "Électricité": 450000,
    "Amortissements": 320000,
    "Frais généraux": 280000,
    "Entretien/Réparations": 150000,
};

function rowTotal(row: Record<string, number>): number {
    return Object.values(row).reduce((a, b) => a + b, 0);
}

export default function RepartitionPage() {
    const [primaire, setPrimaire] = useState<Matrix>(initPrimaire);
    const [secondaire, setSecondaire] = useState<Matrix>(initSecondaire);
    const [step, setStep] = useState<"primaire" | "secondaire">("primaire");

    const allCentres = [...PRINCIPAL_CENTRES, ...AUX_CENTRES];

    const updateCell = (
        matrix: Matrix,
        setMatrix: React.Dispatch<React.SetStateAction<Matrix>>,
        row: string,
        col: string,
        val: number
    ) => {
        setMatrix({ ...matrix, [row]: { ...matrix[row], [col]: val } });
    };

    const isRowValid = (row: Record<string, number>) => Math.abs(rowTotal(row) - 100) < 0.01;

    // Calculate primary totals per centre
    const primaryTotals: Record<string, number> = {};
    [...PRINCIPAL_CENTRES, ...AUX_CENTRES].forEach((c) => {
        primaryTotals[c] = NATURES.reduce((sum, n) => {
            const pct = primaire[n]?.[c] ?? 0;
            return sum + (TOTAUX[n] * pct) / 100;
        }, 0);
    });

    // Secondary totals transferred to principal centres
    const secondaryTransfer: Record<string, number> = {};
    PRINCIPAL_CENTRES.forEach((p) => {
        secondaryTransfer[p] = AUX_CENTRES.reduce((sum, a) => {
            const pct = secondaire[a]?.[p] ?? 0;
            return sum + (primaryTotals[a] * pct) / 100;
        }, 0);
    });

    const finalTotals: Record<string, number> = {};
    PRINCIPAL_CENTRES.forEach((p) => {
        finalTotals[p] = primaryTotals[p] + secondaryTransfer[p];
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Répartition</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Répartition primaire et secondaire des charges indirectes (UC-03)
                    </p>
                </div>
                <button
                    onClick={() => { setPrimaire(initPrimaire); setSecondaire(initSecondaire); }}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary"
                >
                    <RefreshCw className="h-4 w-4" /> Réinitialiser
                </button>
            </div>

            {/* Steps */}
            <div className="flex gap-3">
                {(["primaire", "secondaire"] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setStep(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${step === s
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-border text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        {s === "primaire" ? "① Répartition Primaire" : "② Répartition Secondaire"}
                    </button>
                ))}
            </div>

            {step === "primaire" && (
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        Les pourcentages de chaque ligne doivent totaliser exactement 100%.
                    </div>
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Nature de charge</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Montant total</th>
                                    {allCentres.map((c) => (
                                        <th key={c} className={`text-center px-3 py-3 text-xs font-semibold uppercase ${AUX_CENTRES.includes(c) ? "text-cyan-600" : "text-indigo-600"}`}>
                                            {c}
                                        </th>
                                    ))}
                                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase">Total %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {NATURES.map((n) => {
                                    const total = rowTotal(primaire[n] ?? {});
                                    const valid = isRowValid(primaire[n] ?? {});
                                    return (
                                        <tr key={n} className="border-b border-border/50 hover:bg-secondary/20">
                                            <td className="px-4 py-2.5 font-medium text-foreground">{n}</td>
                                            <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">{formatCurrency(TOTAUX[n])}</td>
                                            {allCentres.map((c) => (
                                                <td key={c} className="px-2 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        className={`w-16 text-center text-sm border rounded-lg px-2 py-1 bg-input ${AUX_CENTRES.includes(c) ? "border-cyan-200 focus:ring-cyan-300" : "border-indigo-200 focus:ring-indigo-300"} focus:ring-2 focus:outline-none`}
                                                        value={primaire[n]?.[c] ?? 0}
                                                        onChange={(e) => updateCell(primaire, setPrimaire, n, c, parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${valid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                                    {total.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-muted/30 border-t border-border">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-foreground">Total centres</td>
                                    <td className="px-4 py-3 text-right font-bold text-foreground font-mono text-xs">{formatCurrency(Object.values(TOTAUX).reduce((a, b) => a + b, 0))}</td>
                                    {allCentres.map((c) => (
                                        <td key={c} className="px-3 py-3 text-center font-bold text-foreground font-mono text-xs">
                                            {formatCurrency(primaryTotals[c])}
                                        </td>
                                    ))}
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {step === "secondaire" && (
                <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        Les totaux des centres auxiliaires (après répartition primaire) sont redistribués vers les centres principaux.
                    </div>

                    {/* Auxiliary totals */}
                    <div className="grid grid-cols-2 gap-3">
                        {AUX_CENTRES.map((a) => (
                            <div key={a} className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                                <p className="text-sm font-bold text-cyan-800">{a}</p>
                                <p className="text-lg font-bold text-cyan-700 mt-1">{formatCurrency(primaryTotals[a])}</p>
                                <p className="text-xs text-cyan-600">Total après répartition primaire</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Centre auxiliaire</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Total à répartir</th>
                                    {PRINCIPAL_CENTRES.map((c) => (
                                        <th key={c} className="text-center px-3 py-3 text-xs font-semibold text-indigo-600 uppercase">{c}</th>
                                    ))}
                                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase">Total %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {AUX_CENTRES.map((a) => {
                                    const total = rowTotal(secondaire[a] ?? {});
                                    const valid = Math.abs(total - 100) < 0.01;
                                    return (
                                        <tr key={a} className="border-b border-border/50 hover:bg-secondary/20">
                                            <td className="px-4 py-2.5 font-medium text-cyan-700">{a}</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatCurrency(primaryTotals[a])}</td>
                                            {PRINCIPAL_CENTRES.map((c) => (
                                                <td key={c} className="px-2 py-2 text-center">
                                                    <div>
                                                        <input
                                                            type="number" min="0" max="100"
                                                            className="w-16 text-center text-sm border border-indigo-200 rounded-lg px-2 py-1 bg-input focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                                                            value={secondaire[a]?.[c] ?? 0}
                                                            onChange={(e) => updateCell(secondaire, setSecondaire, a, c, parseFloat(e.target.value) || 0)}
                                                        />
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency((primaryTotals[a] * (secondaire[a]?.[c] ?? 0)) / 100)}</p>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${valid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                                    {total.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-indigo-50/50 border-t border-indigo-200">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 font-bold text-indigo-800">Total final par centre principal</td>
                                    {PRINCIPAL_CENTRES.map((c) => (
                                        <td key={c} className="px-3 py-3 text-center font-bold text-indigo-700 text-sm">
                                            {formatCurrency(finalTotals[c])}
                                        </td>
                                    ))}
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
