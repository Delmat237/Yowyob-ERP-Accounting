"use client";

import { useState } from "react";
import { AxeAnalytique, TypeAxe } from "@/lib/mock-data";
import { Layers, ChevronDown, ChevronRight, Pencil, Trash2, Plus } from "lucide-react";

const TYPE_LABELS: Record<TypeAxe, string> = {
    PRINCIPAL: "Principal",
    AUXILIAIRE: "Auxiliaire",
};

interface PlanAnalytiqueListProps {
    axes: AxeAnalytique[];
    onEdit: (axe: AxeAnalytique) => void;
    onDelete: (id: string) => void;
    onAddAccount: (axeId: string) => void;
}

export function PlanAnalytiqueList({ axes, onEdit, onDelete, onAddAccount }: PlanAnalytiqueListProps) {
    const [expanded, setExpanded] = useState<string[]>([]);

    const toggle = (id: string) =>
        setExpanded((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="w-10 p-3" />
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Axe / Code</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {axes.map((axe) => {
                            const isExp = expanded.includes(axe.id);
                            return (
                                <div key={axe.id} className="contents">
                                    <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="p-3 text-center">
                                            <button onClick={() => toggle(axe.id)} className="p-1 rounded hover:bg-secondary">
                                                {isExp ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                                                    <Layers className="h-3.5 w-3.5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{axe.libelle}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{axe.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${axe.type === "PRINCIPAL"
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-cyan-50 text-cyan-700 border-cyan-200"
                                                }`}>
                                                {TYPE_LABELS[axe.type]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${axe.actif
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-muted text-muted-foreground border-border"
                                                }`}>
                                                {axe.actif ? "Actif" : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => onEdit(axe)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(axe.id)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {isExp && (
                                        <tr className="bg-muted/20">
                                            <td colSpan={5} className="px-12 py-4">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Comptes analytiques rattachés</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {["CA-001", "CA-002", "CA-003"].map((code) => (
                                                        <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium text-foreground shadow-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            {code} — {axe.libelle}
                                                        </span>
                                                    ))}
                                                    <button
                                                        onClick={() => onAddAccount(axe.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" /> Ajouter un compte
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </div>
                            );
                        })}
                    </tbody>
                </table>
                {axes.length === 0 && (
                    <div className="py-16 text-center">
                        <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Aucun axe analytique trouvé</p>
                    </div>
                )}
            </div>
        </div>
    );
}
