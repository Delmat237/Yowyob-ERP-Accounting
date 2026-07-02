"use client";

import { formatCurrency } from "@/lib/utils";
import { MethodeStock } from "@/lib/mock-data";

interface StockMovement {
    date: string;
    libelle: string;
    entreeQte: number;
    entreePrix: number;
    sortieQte: number;
    sortiePrix: number;
    stockQte: number;
    stockVal: number;
}

interface StockMovementTableProps {
    data: StockMovement[];
    methode: MethodeStock;
}

export function StockMovementTable({ data, methode }: StockMovementTableProps) {
    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/20">
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest flex items-center justify-between">
                    <span>Tableau de stock matières</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[9px]">{methode}</span>
                </h3>
            </div>
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest divide-x divide-border/20">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Libellé</th>
                        <th className="px-3 py-3 text-right" colSpan={2}>Entrées (Qté | Val.)</th>
                        <th className="px-3 py-3 text-right" colSpan={2}>Sorties (Qté | Val.)</th>
                        <th className="px-3 py-3 text-right" colSpan={2}>Stock (Qté | Val.)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {data.map((r, i) => (
                        <tr key={i} className="hover:bg-secondary/20 transition-colors animate-fade-in divide-x divide-border/10">
                            <td className="px-4 py-2.5 text-muted-foreground text-[10px] font-medium">{r.date}</td>
                            <td className="px-4 py-2.5 text-foreground font-bold text-[11px] uppercase tracking-tighter">{r.libelle}</td>

                            <td className="px-3 py-2.5 text-right text-cyan-700 font-bold text-[11px]">{r.entreeQte > 0 ? r.entreeQte : "—"}</td>
                            <td className="px-3 py-2.5 text-right text-cyan-600 font-mono text-[10px] bg-cyan-50/10">
                                {r.entreeQte > 0 ? formatCurrency(r.entreeQte * r.entreePrix) : "—"}
                            </td>

                            <td className="px-3 py-2.5 text-right text-rose-700 font-bold text-[11px]">{r.sortieQte > 0 ? r.sortieQte : "—"}</td>
                            <td className="px-3 py-2.5 text-right text-rose-600 font-mono text-[10px] bg-rose-50/10">
                                {r.sortieQte > 0 ? formatCurrency(r.sortieQte * r.sortiePrix) : "—"}
                            </td>

                            <td className="px-3 py-2.5 text-right font-black text-foreground text-[11px]">{r.stockQte}</td>
                            <td className="px-3 py-2.5 text-right font-black text-foreground font-mono text-[10px] bg-secondary/10">
                                {formatCurrency(r.stockVal)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
