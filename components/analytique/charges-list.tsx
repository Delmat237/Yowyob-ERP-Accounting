"use client";

import { ChargeAnalytique, CentreAnalyse } from "@/lib/analytique/mock-data";
import { formatCurrency } from "@/lib/utils";
import { FileText, Pencil, Trash2 } from "lucide-react";

interface ChargesListProps {
    charges: ChargeAnalytique[];
    centres: CentreAnalyse[];
    onEdit: (charge: ChargeAnalytique) => void;
    onDelete: (id: string) => void;
}

export function ChargesList({ charges, centres, onEdit, onDelete }: ChargesListProps) {
    const getCentreLabel = (id: string) => centres.find((c) => c.id === id)?.libelle ?? "—";

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        {["Nature", "Montant", "Type", "Centre", "Incorporable", "Actions"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {charges.map((c) => (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg"><FileText className="h-3.5 w-3.5 text-primary" /></div>
                                    <div>
                                        <p className="font-medium text-foreground">{c.nature}</p>
                                        {c.description && <p className="text-xs text-muted-foreground italic">{c.description}</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(c.montant)}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${c.type === "DIRECTE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-cyan-50 text-cyan-700 border-cyan-200"}`}>
                                    {c.type === "DIRECTE" ? "Directe" : "Indirecte"}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{getCentreLabel(c.centreId)}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${c.incorporable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                    {c.incorporable ? "Oui" : "Non"}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => onDelete(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
