"use client";

import { useState } from "react";
import { ChargeAnalytique } from "@/lib/analytique/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, RefreshCw, FileText, Search, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { ChargeAnalytiqueForm } from "@/components/analytique/charge-form-modal";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { useChargesAnalytiquesApi } from "@/hooks/use-charges-analytiques-api";
import { useCentresAnalyseApi } from "@/hooks/use-centres-analyse-api";
import { usePeriodesAnalytiquesAlignees } from "@/hooks/use-periodes-analytiques-alignees";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

export default function ChargesPage() {
    const { periodes } = usePeriodesAnalytiquesAlignees();
    const periodeCourante = periodes.find((p) => p.statut === "EN_COURS") ?? periodes[0];
    const { charges, loading, saveCharge, removeCharge, error, usingMockFallback } = useChargesAnalytiquesApi(periodeCourante?.id);
    const { centres, usingMockFallback: centresMock } = useCentresAnalyseApi();
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<"all" | "DIRECTE" | "INDIRECTE">("all");
    const { openForm, closeForm } = useAnalytiqueCompose();

    const filtered = charges.filter((c) => {
        const matchSearch = c.nature.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || c.type === typeFilter;
        return matchSearch && matchType;
    });

    const handleSave = async (data: Partial<ChargeAnalytique>) => {
        await saveCharge({
            ...data,
            periodeId: data.periodeId ?? periodeCourante?.id,
        });
    };

    const openChargeForm = (initial?: Partial<ChargeAnalytique>) => {
        openForm(
            initial?.id ? "Modifier la charge analytique" : "Nouvelle charge analytique",
            <ChargeAnalytiqueForm
                initial={{ ...initial, periodeId: initial?.periodeId ?? periodeCourante?.id }}
                centres={centres}
                onCancel={closeForm}
                onSubmit={(data) => {
                    void handleSave(data).then(closeForm);
                }}
            />,
        );
    };

    const totalDirect = charges.filter((c) => c.type === "DIRECTE").reduce((s, c) => s + c.montant, 0);
    const totalIndirect = charges.filter((c) => c.type === "INDIRECTE").reduce((s, c) => s + c.montant, 0);

    if (loading) return <CustomPageLoader />;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {(error || usingMockFallback || centresMock) && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error ?? "Certaines données proviennent du mode démonstration."}</p>
                </div>
            )}

            {deleteId && (
                <ConfirmDialog
                    title="Supprimer cette charge ?"
                    onClose={() => setDeleteId(null)}
                    onConfirm={() => {
                        void removeCharge(deleteId);
                        setDeleteId(null);
                    }}
                >
                    <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
                </ConfirmDialog>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Charges Analytiques</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Saisie et suivi des charges directes et indirectes</p>
                </div>
                <button onClick={() => openChargeForm()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm">
                    <Plus className="h-4 w-4" /> Nouvelle charge
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total charges", val: formatCurrency(charges.reduce((s, c) => s + c.montant, 0)), icon: FileText, color: "text-primary" },
                    { label: "Directes", val: formatCurrency(totalDirect), icon: TrendingUp, color: "text-emerald-600" },
                    { label: "Indirectes", val: formatCurrency(totalIndirect), icon: TrendingDown, color: "text-rose-600" },
                    { label: "Incorporables", val: charges.filter((c) => c.incorporable).length, icon: RefreshCw, color: "text-indigo-600" },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon className={`h-4 w-4 ${s.color}`} />
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                        <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex border border-border rounded-xl overflow-hidden">
                    {(["all", "DIRECTE", "INDIRECTE"] as const).map((f) => (
                        <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-2 text-xs font-bold uppercase ${typeFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                            {f === "all" ? "Toutes" : f === "DIRECTE" ? "Directes" : "Indirectes"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Nature", "Centre", "Type", "Montant", "Incorporable", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filtered.map((c) => {
                            const centre = centres.find((x) => x.id === c.centreId);
                            return (
                                <tr key={c.id} className="hover:bg-secondary/30">
                                    <td className="px-4 py-3 font-medium">{c.nature}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{centre?.libelle ?? c.centreId}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.type === "DIRECTE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{c.type}</span>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-semibold">{formatCurrency(c.montant)}</td>
                                    <td className="px-4 py-3">{c.incorporable ? "Oui" : "Non"}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openChargeForm(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
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
