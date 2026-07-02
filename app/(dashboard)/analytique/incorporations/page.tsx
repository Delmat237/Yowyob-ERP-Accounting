"use client";

import { useState } from "react";
import {
    mockReglesIncorporation,
    RegleIncorporation, ModeIncorporation,
} from "@/lib/analytique/mock-data";
import { useComptesComptablesCG } from "@/hooks/use-comptes-comptables-cg";
import { Plus, Pencil, Trash2, AlertTriangle, Upload, Search, Loader2 } from "lucide-react";
import { FloatingModal } from "@/components/ui/floating-modal";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";

const MODE_CONFIG: Record<ModeIncorporation, { label: string; color: string }> = {
    INCORPORABLE: { label: "Incorporable", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    NON_INCORPORABLE: { label: "Non incorporable", color: "bg-rose-50 text-rose-700 border-rose-200" },
    SUBSTITUTION: { label: "Substitution", color: "bg-amber-50 text-amber-700 border-amber-200" },
};


export default function IncorporationsPage() {
    const [regles, setRegles] = useState<RegleIncorporation[]>(mockReglesIncorporation);
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<RegleIncorporation> }>({ open: false });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [modeFilter, setModeFilter] = useState<ModeIncorporation | "all">("all");

    const filtered = regles.filter((r) => {
        const matchSearch = r.libelle.toLowerCase().includes(search.toLowerCase()) || r.compteCGNo.includes(search);
        const matchMode = modeFilter === "all" || r.mode === modeFilter;
        return matchSearch && matchMode;
    });

    function handleSave(data: RegleIncorporation) {
        setRegles((p) => p.find((r) => r.id === data.id) ? p.map((r) => r.id === data.id ? data : r) : [...p, data]);
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {modal.open && <Modal initial={modal.initial} onClose={() => setModal({ open: false })} onSave={handleSave} />}
            {deleteId && (
                <ConfirmDialog
                    title="Supprimer cette règle ?"
                    onClose={() => setDeleteId(null)}
                    cancelLabel="Fermer"
                    showConfirm={!regles.find((r) => r.id === deleteId)?.hasEcritures}
                    onConfirm={() => setRegles((p) => p.filter((r) => r.id !== deleteId))}
                >
                    {regles.find((r) => r.id === deleteId)?.hasEcritures ? (
                        <p className="text-sm text-rose-600">Impossible — des écritures ont déjà utilisé cette règle dans la période en cours.</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
                    )}
                </ConfirmDialog>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Incorporations des Charges</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Règles de traitement analytique des comptes CG</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
                        <Upload className="h-4 w-4" /> Importer CSV
                    </button>
                    <button onClick={() => setModal({ open: true })}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-95">
                        <Plus className="h-4 w-4" /> Nouvelle règle
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Incorporables", val: regles.filter((r) => r.mode === "INCORPORABLE").length, color: "text-emerald-700" },
                    { label: "Exclues", val: regles.filter((r) => r.mode === "NON_INCORPORABLE").length, color: "text-rose-600" },
                    { label: "Substitutions", val: regles.filter((r) => r.mode === "SUBSTITUTION").length, color: "text-amber-600" },
                    { label: "Règles actives", val: regles.filter((r) => r.dateFin === undefined || new Date(r.dateFin) > new Date()).length, color: "text-primary" },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-sm">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-3 flex-wrap bg-card p-3 rounded-2xl border border-border shadow-sm">
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Rechercher compte ou libellé…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="h-8 w-px bg-border hidden sm:block"></div>
                <div className="flex gap-1">
                    {(["all", "INCORPORABLE", "NON_INCORPORABLE", "SUBSTITUTION"] as const).map((f) => (
                        <button key={f} onClick={() => setModeFilter(f)}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${modeFilter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
                            {f === "all" ? "TOUTES" : MODE_CONFIG[f].label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>{["Compte CG", "Libellé / Règle", "Validité", "Mode", "Justification", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((r) => {
                                const cfg = MODE_CONFIG[r.mode];
                                return (
                                    <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-4 font-mono font-bold text-sm text-foreground">
                                            <div className="px-2 py-0.5 bg-muted rounded border border-border inline-block">{r.compteCGNo}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{r.libelle}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {r.mode === "SUBSTITUTION" && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase border border-amber-200">
                                                            {r.tauxSubstitution ? `${r.tauxSubstitution}%` : `${(r.montantSubstitution || 0).toLocaleString()} FCFA`} substitué
                                                        </span>
                                                    )}
                                                    {r.compteEcart97 && (
                                                        <span className="text-[10px] text-muted-foreground font-mono">➡ Ecart: {r.compteEcart97}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col text-[10px]">
                                                <span className="text-muted-foreground">Du: <span className="text-foreground font-medium">{r.dateDebut || "Inconnue"}</span></span>
                                                <span className="text-muted-foreground">Au: <span className="text-foreground font-medium">{r.dateFin || "Illimitée"}</span></span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase shadow-sm ${cfg.color}`}>{cfg.label}</span>
                                        </td>
                                        <td className="px-4 py-4 max-w-[150px]">
                                            <p className="text-[11px] text-muted-foreground italic line-clamp-2" title={r.justification}>{r.justification || "—"}</p>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setModal({ open: true, initial: r })} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                                                <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex gap-4 text-xs text-amber-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Consignes OHADA / Melyon</p>
                    <p>Une seule règle par nature de compte CG. Si une charge est <strong>Non incorporable</strong>, elle doit être justifiée (ex: charges exceptionnelles). Si elle est <strong>Substituée</strong>, l&apos;écart d&apos;incorporation sera porté au débit ou crédit du compte de classe 97.</p>
                </div>
            </div>
        </div>
    );
}

function Modal({
    initial, onClose, onSave,
}: { initial?: Partial<RegleIncorporation>; onClose: () => void; onSave: (d: RegleIncorporation) => void }) {
    const { accounts: comptesCG, loading: loadingCG, error: errorCG } = useComptesComptablesCG({
        classes: [6],
    });
    const [form, setForm] = useState<Partial<RegleIncorporation>>({
        mode: "INCORPORABLE", tauxSubstitution: 0, montantSubstitution: 0, justification: "", compteEcart97: "", hasEcritures: false, ...initial,
    });

    const [subType, setSubType] = useState<"taux" | "fixe">(form.montantSubstitution ? "fixe" : "taux");

    function selectCompte(accountKey: string) {
        const c = comptesCG.find((x) => (x.id ?? x.noCompte) === accountKey);
        if (!c) return;
        setForm((f) => ({
            ...f,
            compteCGId: c.id ?? c.noCompte,
            compteCGNo: c.noCompte,
            libelle: c.libelle,
        }));
    }

    const isEdit = !!initial?.id;
    const valid = !!form.compteCGId && !!form.mode && !loadingCG;

    return (
        <FloatingModal
            title={isEdit ? "Modifier la règle" : "Nouvelle règle d'incorporation"}
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3 px-6 py-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-300 text-muted-foreground hover:bg-slate-50 font-medium transition-colors">Annuler</button>
                    <button
                        disabled={!valid}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `ri-${Date.now()}`,
                                compteCGId: form.compteCGId!,
                                compteCGNo: form.compteCGNo!,
                                libelle: form.libelle!,
                                mode: form.mode!,
                                tauxSubstitution: form.tauxSubstitution,
                                montantSubstitution: form.montantSubstitution,
                                baseCalcul: form.baseCalcul,
                                justification: form.justification,
                                compteEcart97: form.compteEcart97,
                                dateDebut: form.dateDebut,
                                dateFin: form.dateFin,
                                hasEcritures: form.hasEcritures ?? false
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                        {isEdit ? "Enregistrer les modifications" : "Activer la règle"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-foreground block mb-1.5">Compte CG à traiter *</label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Comptes de charges (classe 6) issus de la comptabilité générale.
                            </p>
                            {errorCG && (
                                <div className="mb-2 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
                                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                    {errorCG}
                                </div>
                            )}
                            <div className="relative">
                                {loadingCG && (
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                <select
                                    className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 font-mono"
                                    value={form.compteCGId ?? ""}
                                    onChange={(e) => selectCompte(e.target.value)}
                                    disabled={isEdit || loadingCG}
                                >
                                    <option value="">
                                        {loadingCG ? "Chargement des comptes comptables…" : "— Sélectionner un compte de charges —"}
                                    </option>
                                    {comptesCG.map((c) => {
                                        const key = c.id ?? c.noCompte;
                                        return (
                                            <option key={key} value={key}>
                                                {c.noCompte} — {c.libelle}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            {form.libelle && (
                                <p className="mt-2 text-xs text-primary font-bold bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 italic">
                                    Traitement de : {form.libelle}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-bold text-foreground block mb-1.5">Règle de traitement *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["INCORPORABLE", "NON_INCORPORABLE", "SUBSTITUTION"] as ModeIncorporation[]).map((m) => (
                                    <button key={m} type="button" onClick={() => setForm((f) => ({ ...f, mode: m }))}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all shadow-sm uppercase ${form.mode === m ? "bg-primary text-primary-foreground border-primary scale-[1.02]" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                                        {MODE_CONFIG[m].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {form.mode === "SUBSTITUTION" && (
                            <div className="space-y-3 p-4 bg-amber-50/50 border border-amber-200 rounded-2xl shadow-inner animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-2 mb-2">
                                    <button type="button" onClick={() => setSubType("taux")} className={`px-2 py-1 rounded text-[10px] font-bold border ${subType === "taux" ? "bg-amber-100 border-amber-300 text-amber-800" : "border-transparent text-muted-foreground"}`}>TAUX (%)</button>
                                    <button type="button" onClick={() => setSubType("fixe")} className={`px-2 py-1 rounded text-[10px] font-bold border ${subType === "fixe" ? "bg-amber-100 border-amber-300 text-amber-800" : "border-transparent text-muted-foreground"}`}>MONTANT FIXE</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {subType === "taux" ? (
                                        <div>
                                            <label className="text-[10px] font-bold text-amber-800 uppercase">Taux (%)</label>
                                            <input type="number" min={0} max={200} className="mt-1 w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-input focus:ring-1 focus:ring-amber-400 outline-none"
                                                value={form.tauxSubstitution ?? 0} onChange={(e) => setForm({ ...form, tauxSubstitution: Number(e.target.value), montantSubstitution: 0 })} />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-[10px] font-bold text-amber-800 uppercase">Montant Fixe</label>
                                            <input type="number" min={0} className="mt-1 w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-input focus:ring-1 focus:ring-amber-400 outline-none"
                                                value={form.montantSubstitution ?? 0} onChange={(e) => setForm({ ...form, montantSubstitution: Number(e.target.value), tauxSubstitution: 0 })} />
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[10px] font-bold text-amber-800 uppercase">Compte Ecart (97)</label>
                                        <input className="mt-1 w-full text-sm border border-amber-200 rounded-xl px-3 font-mono py-2 bg-input focus:ring-1 focus:ring-amber-400 outline-none"
                                            placeholder="Ex: 9710" value={form.compteEcart97 ?? ""}
                                            onChange={(e) => setForm({ ...form, compteEcart97: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-amber-800 uppercase">Base de calcul</label>
                                    <input className="mt-1 w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-input focus:ring-1 focus:ring-amber-400 outline-none"
                                        placeholder="Ex: Valeur de remplacement..." value={form.baseCalcul ?? ""}
                                        onChange={(e) => setForm({ ...form, baseCalcul: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-foreground block mb-1.5">Date Début Application</label>
                                <input type="date" className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={form.dateDebut ?? ""} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-foreground block mb-1.5">Date Fin (Optionnel)</label>
                                <input type="date" className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={form.dateFin ?? ""} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-foreground block mb-1.5">Justification / Observations</label>
                            <textarea className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input h-16 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="Motif de l'exclusion ou détail sur la substitution..."
                                value={form.justification ?? ""} onChange={(e) => setForm({ ...form, justification: e.target.value })} />
                        </div>
                    </div>
            </div>
        </FloatingModal>
    );
}


