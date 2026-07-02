"use client";

import { CentreAnalyse, TypeCentre, mockComptesAnalytiques } from "@/lib/analytique/mock-data";
import { GitBranch, Pencil, Trash2, User, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const NATURE_LABELS: Record<TypeCentre, string> = {
    CENTRE_TRAVAIL: "Travail",
    CENTRE_RESPONSABILITE: "Responsabilité",
    CENTRE_PROFITS: "Profits",
    CENTRE_RENTABILITE: "Rentabilité",
    CENTRE_AUXILIAIRE: "Auxiliaire",
    CENTRE_PRINCIPAL: "Principal",
};

const NATURE_COLORS: Record<TypeCentre, string> = {
    CENTRE_TRAVAIL: "bg-blue-50 text-blue-700 border-blue-200",
    CENTRE_RESPONSABILITE: "bg-violet-50 text-violet-700 border-violet-200",
    CENTRE_PROFITS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CENTRE_RENTABILITE: "bg-amber-50 text-amber-700 border-amber-200",
    CENTRE_AUXILIAIRE: "bg-cyan-50 text-cyan-700 border-cyan-200",
    CENTRE_PRINCIPAL: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

interface CentresAnalyseListProps {
    centres: CentreAnalyse[];
    onEdit: (centre: CentreAnalyse) => void;
    onDelete: (id: string) => void;
}

export function CentresAnalyseList({ centres, onEdit, onDelete }: CentresAnalyseListProps) {
    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identifiant</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsabilité</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compte 92</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget Alloué</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nature</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {centres.map((c) => {
                            const account = mockComptesAnalytiques.find(acc => acc.id === c.compteAnalytiqueId);
                            return (
                                <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{c.libelle}</span>
                                            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tighter">{c.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            <span>{c.responsable || "— Non assigné"}</span>
                                        </div>
                                        <div className="text-[10px] italic mt-1">{c.uniteOeuvre}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {account ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-muted rounded border border-border">{account.numero}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{account.libelle}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-rose-500 font-medium">Non lié</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        {c.budgetAlloue ? (
                                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-600">
                                                <Wallet className="h-3 w-3" />
                                                {formatCurrency(c.budgetAlloue)}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Non budgété</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${NATURE_COLORS[c.nature]}`}>
                                            {NATURE_LABELS[c.nature]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.actif ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${c.actif ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                            {c.actif ? "Actif" : "Inactif"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => onDelete(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
