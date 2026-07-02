"use client";

import { useState } from "react";
import { mockCharges, ChargeAnalytique, mockCentres } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, RefreshCw, FileText, Search, TrendingUp, TrendingDown } from "lucide-react";

function ChargeModal({
    initial, onClose, onSave,
}: { initial?: Partial<ChargeAnalytique>; onClose: () => void; onSave: (d: Partial<ChargeAnalytique>) => void }) {
    const [form, setForm] = useState<Partial<ChargeAnalytique>>({
        nature: "", montant: 0, type: "DIRECTE", incorporable: true, centreId: mockCentres[0].id, ...initial,
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">{initial?.id ? "Modifier la charge" : "Nouvelle charge analytique"}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium">Nature de la charge *</label>
                        <input className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input" value={form.nature ?? ""} onChange={(e) => setForm({ ...form, nature: e.target.value })} placeholder="Ex: Matières premières" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Montant (FCFA) *</label>
                        <input type="number" className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input" value={form.montant ?? 0} onChange={(e) => setForm({ ...form, montant: parseFloat(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Type *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input" value={form.type ?? "DIRECTE"} onChange={(e) => setForm({ ...form, type: e.target.value as "DIRECTE" | "INDIRECTE" })}>
                                <option value="DIRECTE">Directe</option>
                                <option value="INDIRECTE">Indirecte</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Centre *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input" value={form.centreId ?? ""} onChange={(e) => setForm({ ...form, centreId: e.target.value })}>
                                {mockCentres.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="incorporable" checked={form.incorporable ?? true} onChange={(e) => setForm({ ...form, incorporable: e.target.checked })} className="rounded" />
                        <label htmlFor="incorporable" className="text-sm font-medium">Incorporable aux coûts</label>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <textarea className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input h-16 resize-none" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button onClick={() => { onSave(form); onClose(); }} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                        {initial?.id ? "Enregistrer" : "Créer la charge"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ChargesPage() {
    const [charges, setCharges] = useState<ChargeAnalytique[]>(mockCharges);
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<ChargeAnalytique> }>({ open: false });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<"all" | "DIRECTE" | "INDIRECTE">("all");

    const filtered = charges.filter((c) => {
        const matchSearch = c.nature.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || c.type === typeFilter;
        return matchSearch && matchType;
    });

    const total = charges.reduce((s, c) => s + c.montant, 0);
    const directes = charges.filter((c) => c.type === "DIRECTE").reduce((s, c) => s + c.montant, 0);
    const indirectes = charges.filter((c) => c.type === "INDIRECTE").reduce((s, c) => s + c.montant, 0);
    const nonIncorporables = charges.filter((c) => !c.incorporable).reduce((s, c) => s + c.montant, 0);

    const getCentreLabel = (id: string) => mockCentres.find((c) => c.id === id)?.libelle ?? "—";

    const handleSave = (data: Partial<ChargeAnalytique>) => {
        if (data.id) {
            setCharges((p) => p.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
        } else {
            setCharges((p) => [...p, { id: `ch${Date.now()}`, nature: data.nature ?? "", montant: data.montant ?? 0, type: data.type ?? "DIRECTE", incorporable: data.incorporable ?? true, centreId: data.centreId ?? "c1", periodeId: "p3" }]);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {modal.open && <ChargeModal initial={modal.initial} onClose={() => setModal({ open: false })} onSave={handleSave} />}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6">
                        <h3 className="text-base font-bold mb-2">Confirmer la suppression</h3>
                        <p className="text-sm text-muted-foreground mb-4">Cette action est irréversible.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                            <button onClick={() => { setCharges((p) => p.filter((c) => c.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 text-sm rounded-xl bg-destructive text-destructive-foreground font-medium">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Charges Analytiques</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Saisie et imputation des charges (BF-03 à BF-05)</p>
                </div>
                <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm">
                    <Plus className="h-4 w-4" /> Nouvelle charge
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total charges", val: formatCurrency(total), icon: FileText, color: "bg-indigo-100 text-indigo-600" },
                    { label: "Directes", val: formatCurrency(directes), icon: TrendingDown, color: "bg-emerald-100 text-emerald-600" },
                    { label: "Indirectes", val: formatCurrency(indirectes), icon: TrendingUp, color: "bg-cyan-100 text-cyan-600" },
                    { label: "Non incorporables", val: formatCurrency(nonIncorporables), icon: FileText, color: "bg-red-100 text-red-600" },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                        <div className={`p-2 rounded-lg w-fit ${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
                        <p className="text-lg font-bold text-foreground">{s.val}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input focus:ring-2 focus:ring-ring" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex border border-border rounded-xl overflow-hidden">
                    {(["all", "DIRECTE", "INDIRECTE"] as const).map((f) => (
                        <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-2 text-sm transition-colors ${typeFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                            {f === "all" ? "Toutes" : f === "DIRECTE" ? "Directes" : "Indirectes"}
                        </button>
                    ))}
                </div>
                <button onClick={() => setCharges(mockCharges)} className="p-2 border border-border rounded-xl text-muted-foreground hover:bg-secondary"><RefreshCw className="h-4 w-4" /></button>
            </div>

            {/* Table */}
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
                        {filtered.map((c) => (
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
                                        <button onClick={() => setModal({ open: true, initial: c })} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
