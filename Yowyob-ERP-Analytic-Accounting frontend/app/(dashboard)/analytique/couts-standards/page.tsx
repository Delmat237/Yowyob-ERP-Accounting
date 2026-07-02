"use client";

import { useState } from "react";
import {
    mockFichesCoutStandard, mockPeriodes, mockCentres, mockPlansAnalytiques,
    FicheCoutStandard, LigneCoutStandard, ComposanteCout,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
    Plus, Pencil, Trash2, X, AlertTriangle, Upload,
    Copy, Lock, CheckCircle2, ChevronDown, ChevronRight,
} from "lucide-react";

const COMPOSANTE_CONFIG: Record<ComposanteCout, { label: string; color: string }> = {
    MATIERES: { label: "Matières", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    MOD: { label: "M.O.D", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    CHARGES_INDIRECTES: { label: "Charges Indirectes", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// ─── Modal ligne de coût standard ────────────────────────────────────────────
function LigneModal({
    initial, onClose, onSave,
}: { initial?: Partial<LigneCoutStandard>; onClose: () => void; onSave: (d: LigneCoutStandard) => void }) {
    const [form, setForm] = useState<Partial<LigneCoutStandard>>({
        composante: "MATIERES", libelle: "", quantiteStandard: 0, coutUnitaireStandard: 0, ...initial,
    });

    const total = (form.quantiteStandard ?? 0) * (form.coutUnitaireStandard ?? 0);
    const valid = !!form.libelle?.trim() && (form.quantiteStandard ?? 0) > 0 && (form.coutUnitaireStandard ?? 0) > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">{initial?.id ? "Modifier la ligne" : "Nouvelle composante"}</h2>
                    <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium">Composante *</label>
                        <div className="mt-1 flex gap-2">
                            {(["MATIERES", "MOD", "CHARGES_INDIRECTES"] as ComposanteCout[]).map((c) => (
                                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, composante: c, centreId: undefined, centreLibelle: undefined }))}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${form.composante === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                                    {COMPOSANTE_CONFIG[c].label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {form.composante === "CHARGES_INDIRECTES" && (
                        <div>
                            <label className="text-sm font-medium">Centre d&apos;analyse *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.centreId ?? ""}
                                onChange={(e) => {
                                    const c = mockCentres.find((x) => x.id === e.target.value);
                                    setForm({ ...form, centreId: e.target.value, centreLibelle: c?.libelle });
                                }}>
                                <option value="">— Sélectionner —</option>
                                {mockCentres.filter((c) => c.actif).map((c) => (
                                    <option key={c.id} value={c.id}>{c.libelle}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium">Libellé *</label>
                        <input className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            placeholder="Ex: Matières premières — norme 4,5 kg/u"
                            value={form.libelle ?? ""} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Quantité standard *</label>
                            <input type="number" min={0} step={0.01}
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.quantiteStandard ?? 0} onChange={(e) => setForm({ ...form, quantiteStandard: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Coût unitaire std (FCFA) *</label>
                            <input type="number" min={0}
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.coutUnitaireStandard ?? 0} onChange={(e) => setForm({ ...form, coutUnitaireStandard: Number(e.target.value) })} />
                        </div>
                    </div>
                    {form.composante === "CHARGES_INDIRECTES" && (
                        <div>
                            <label className="text-sm font-medium">Activité normale (UO)</label>
                            <input type="number" min={0}
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                placeholder="Ex: 1000 H.Mod"
                                value={form.activiteNormale ?? ""} onChange={(e) => setForm({ ...form, activiteNormale: Number(e.target.value) })} />
                            <p className="text-xs text-muted-foreground mt-1">Pour les centres à imputation rationnelle.</p>
                        </div>
                    )}
                    {total > 0 && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex justify-between items-center">
                            <span className="text-xs font-semibold text-indigo-700">Coût standard total (calculé)</span>
                            <span className="font-mono font-bold text-indigo-700">{formatCurrency(total)}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button disabled={!valid}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `l-${Date.now()}`,
                                composante: form.composante!,
                                centreId: form.centreId,
                                centreLibelle: form.centreLibelle,
                                libelle: form.libelle!,
                                quantiteStandard: form.quantiteStandard!,
                                coutUnitaireStandard: form.coutUnitaireStandard!,
                                coutStandardTotal: total,
                                activiteNormale: form.activiteNormale,
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50">
                        {initial?.id ? "Enregistrer" : "Ajouter"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Modal fiche principale ───────────────────────────────────────────────────
function FicheModal({
    initial, onClose, onSave,
}: { initial?: Partial<FicheCoutStandard>; onClose: () => void; onSave: (d: FicheCoutStandard) => void }) {
    const [form, setForm] = useState<Partial<FicheCoutStandard>>({
        produitCode: "", produitLibelle: "", periodeRefId: mockPeriodes[3].id,
        planAnalytiqueId: "plan-2026", lignes: [], periodeCommencee: false, ...initial,
    });

    const valid = !!form.produitCode?.trim() && !!form.produitLibelle?.trim() && !!form.periodeRefId;
    const periodeBloquee = form.periodeCommencee;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">
                        {initial?.id ? "Modifier la fiche" : "Nouvelle fiche de coût standard"}
                    </h2>
                    <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                {periodeBloquee && (
                    <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        La période a démarré — cette fiche est en lecture seule.
                    </div>
                )}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Code produit *</label>
                            <input className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                placeholder="PROD-X" value={form.produitCode ?? ""}
                                onChange={(e) => setForm({ ...form, produitCode: e.target.value })}
                                disabled={periodeBloquee} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Libellé produit *</label>
                            <input className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.produitLibelle ?? ""}
                                onChange={(e) => setForm({ ...form, produitLibelle: e.target.value })}
                                disabled={periodeBloquee} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Période de référence *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.periodeRefId ?? ""}
                                onChange={(e) => setForm({ ...form, periodeRefId: e.target.value })}
                                disabled={periodeBloquee}>
                                {mockPeriodes.filter((p) => p.statut !== "CLOTURE").map((p) => (
                                    <option key={p.id} value={p.id}>{p.libelle}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Plan analytique *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.planAnalytiqueId ?? ""}
                                onChange={(e) => setForm({ ...form, planAnalytiqueId: e.target.value })}
                                disabled={periodeBloquee}>
                                {mockPlansAnalytiques.filter((p) => p.statut === "ACTIF").map((p) => (
                                    <option key={p.id} value={p.id}>{p.libelle}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    {!periodeBloquee && (
                        <button disabled={!valid}
                            onClick={() => {
                                onSave({
                                    id: form.id ?? `fcs-${Date.now()}`,
                                    produitCode: form.produitCode!, produitLibelle: form.produitLibelle!,
                                    periodeRefId: form.periodeRefId!, planAnalytiqueId: form.planAnalytiqueId!,
                                    lignes: form.lignes ?? [], periodeCommencee: false,
                                });
                                onClose();
                            }}
                            className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50">
                            {initial?.id ? "Enregistrer" : "Créer"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CoutsStandardsPage() {
    const [fiches, setFiches] = useState<FicheCoutStandard[]>(mockFichesCoutStandard);
    const [ficheModal, setFicheModal] = useState<{ open: boolean; initial?: Partial<FicheCoutStandard> }>({ open: false });
    const [ligneModal, setLigneModal] = useState<{ open: boolean; ficheId: string; initial?: Partial<LigneCoutStandard> } | null>(null);
    const [expanded, setExpanded] = useState<string | null>(fiches[0]?.id ?? null);
    const [deleteFicheId, setDeleteFicheId] = useState<string | null>(null);
    const [filterPeriode, setFilterPeriode] = useState<string>("all");

    const periodesDisponibles = Array.from(new Set(fiches.map((f) => f.periodeRefId)));
    const filtered = fiches.filter((f) => filterPeriode === "all" || f.periodeRefId === filterPeriode);

    function saveFiche(data: FicheCoutStandard) {
        setFiches((p) => p.find((f) => f.id === data.id) ? p.map((f) => f.id === data.id ? data : f) : [...p, data]);
    }

    function saveLigne(ficheId: string, ligne: LigneCoutStandard) {
        setFiches((p) => p.map((f) => {
            if (f.id !== ficheId) return f;
            const exists = f.lignes.find((l) => l.id === ligne.id);
            return { ...f, lignes: exists ? f.lignes.map((l) => l.id === ligne.id ? ligne : l) : [...f.lignes, ligne] };
        }));
    }

    function deleteLigne(ficheId: string, ligneId: string) {
        setFiches((p) => p.map((f) => f.id !== ficheId ? f : { ...f, lignes: f.lignes.filter((l) => l.id !== ligneId) }));
    }

    function dupliquerFiche(fiche: FicheCoutStandard) {
        const clone: FicheCoutStandard = {
            ...fiche,
            id: `fcs-${Date.now()}`,
            produitCode: `${fiche.produitCode}-COPY`,
            periodeRefId: mockPeriodes.find((p) => p.statut === "OUVERT")?.id ?? fiche.periodeRefId,
            periodeCommencee: false,
            lignes: fiche.lignes.map((l) => ({ ...l, id: `${l.id}-c` })),
        };
        setFiches((p) => [...p, clone]);
        setExpanded(clone.id);
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {ficheModal.open && (
                <FicheModal initial={ficheModal.initial} onClose={() => setFicheModal({ open: false })} onSave={saveFiche} />
            )}
            {ligneModal && (
                <LigneModal
                    initial={ligneModal.initial}
                    onClose={() => setLigneModal(null)}
                    onSave={(l) => saveLigne(ligneModal.ficheId, l)}
                />
            )}
            {deleteFicheId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm mx-4 p-6">
                        <h3 className="font-bold mb-2">Archiver cette fiche ?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            La suppression est impossible. La fiche sera archivée pour permettre le recalcul des écarts historiques.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteFicheId(null)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                            <button onClick={() => {
                                setFiches((p) => p.filter((f) => f.id !== deleteFicheId));
                                setDeleteFicheId(null);
                            }} className="px-4 py-2 text-sm rounded-xl bg-muted text-foreground border border-border font-medium">
                                Archiver
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Coûts Standards (Préétablis)</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Normes de consommation et coûts de référence par produit (Paramétrage 9)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary">
                        <Upload className="h-4 w-4" /> Importer CSV
                    </button>
                    <button onClick={() => setFicheModal({ open: true })}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm">
                        <Plus className="h-4 w-4" /> Nouvelle fiche
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total fiches", val: fiches.length, color: "text-primary" },
                    { label: "Modifiables", val: fiches.filter((f) => !f.periodeCommencee).length, color: "text-emerald-700" },
                    { label: "Verrouillées", val: fiches.filter((f) => f.periodeCommencee).length, color: "text-amber-600" },
                    { label: "Lignes totales", val: fiches.reduce((s, f) => s + f.lignes.length, 0), color: "text-indigo-600" },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-sm">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtre période */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Période :</span>
                <div className="flex border border-border rounded-xl overflow-hidden">
                    <button onClick={() => setFilterPeriode("all")}
                        className={`px-3 py-2 text-sm transition-colors ${filterPeriode === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                        Toutes
                    </button>
                    {periodesDisponibles.map((pid) => {
                        const p = mockPeriodes.find((x) => x.id === pid);
                        return (
                            <button key={pid} onClick={() => setFilterPeriode(pid)}
                                className={`px-3 py-2 text-sm transition-colors ${filterPeriode === pid ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                                {p?.libelle ?? pid}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Fiches */}
            <div className="space-y-4">
                {filtered.map((fiche) => {
                    const isOpen = expanded === fiche.id;
                    const periode = mockPeriodes.find((p) => p.id === fiche.periodeRefId);
                    const totalCoutStandard = fiche.lignes.reduce((s, l) => s + l.coutStandardTotal, 0);

                    return (
                        <div key={fiche.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${fiche.periodeCommencee ? "border-amber-200" : "border-border"}`}>
                            {/* En-tête fiche */}
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                                onClick={() => setExpanded(isOpen ? null : fiche.id)}>
                                <div className="flex items-center gap-3 min-w-0">
                                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-foreground">{fiche.produitLibelle}</span>
                                            <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{fiche.produitCode}</span>
                                            {fiche.periodeCommencee
                                                ? <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold"><Lock className="h-2.5 w-2.5" />Verrouillée</span>
                                                : <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold"><CheckCircle2 className="h-2.5 w-2.5" />Modifiable</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Période : {periode?.libelle ?? fiche.periodeRefId} · {fiche.lignes.length} composante(s) · Total : {formatCurrency(totalCoutStandard)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => dupliquerFiche(fiche)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary">
                                        <Copy className="h-3.5 w-3.5" /> Dupliquer
                                    </button>
                                    {!fiche.periodeCommencee && (
                                        <button onClick={() => setFicheModal({ open: true, initial: fiche })}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <button onClick={() => setDeleteFicheId(fiche.id)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Lignes de coût */}
                            {isOpen && (
                                <div className="border-t border-border">
                                    {/* Tableau des lignes */}
                                    {fiche.lignes.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 border-b border-border">
                                                    <tr>
                                                        {["Composante", "Centre", "Libellé", "Qté std", "Coût unit. std", "Coût std total", "Act. normale", ""].map((h) => (
                                                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fiche.lignes.map((l) => {
                                                        const cfg = COMPOSANTE_CONFIG[l.composante];
                                                        return (
                                                            <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/20">
                                                                <td className="px-4 py-2.5">
                                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
                                                                </td>
                                                                <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.centreLibelle ?? "—"}</td>
                                                                <td className="px-4 py-2.5 font-medium max-w-[200px] truncate" title={l.libelle}>{l.libelle}</td>
                                                                <td className="px-4 py-2.5 text-right font-mono text-xs">{l.quantiteStandard}</td>
                                                                <td className="px-4 py-2.5 text-right font-mono text-xs">{formatCurrency(l.coutUnitaireStandard)}</td>
                                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-700">{formatCurrency(l.coutStandardTotal)}</td>
                                                                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{l.activiteNormale ?? "—"}</td>
                                                                <td className="px-4 py-2.5">
                                                                    {!fiche.periodeCommencee && (
                                                                        <div className="flex items-center gap-1">
                                                                            <button onClick={() => setLigneModal({ open: true, ficheId: fiche.id, initial: l })}
                                                                                className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary">
                                                                                <Pencil className="h-3 w-3" />
                                                                            </button>
                                                                            <button onClick={() => deleteLigne(fiche.id, l.id)}
                                                                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-muted/30 border-t border-border">
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-2.5 font-bold text-sm">Coût standard total de la fiche</td>
                                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-lg text-primary">{formatCurrency(totalCoutStandard)}</td>
                                                        <td colSpan={2} />
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}

                                    {/* Ajouter une ligne */}
                                    {!fiche.periodeCommencee && (
                                        <div className="p-4 flex items-center justify-between bg-muted/10 border-t border-border">
                                            {fiche.lignes.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">Aucune composante. Ajoutez des éléments de coût.</p>
                                            )}
                                            <button onClick={() => setLigneModal({ open: true, ficheId: fiche.id })}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 ml-auto">
                                                <Plus className="h-3.5 w-3.5" /> Ajouter une composante
                                            </button>
                                        </div>
                                    )}
                                    {fiche.periodeCommencee && fiche.lignes.length === 0 && (
                                        <div className="p-4 text-center text-sm text-muted-foreground">Aucune composante définie.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-muted/20 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-sm mb-1">Règles métier</p>
                <p><strong>Verrouillage :</strong> une fiche est verrouillée dès que la période de référence a démarré — aucune modification possible.</p>
                <p><strong>Duplication :</strong> permet de reconduire les standards de la période précédente avec ajustements vers une période future.</p>
                <p><strong>Archivage uniquement :</strong> la suppression est remplacée par un archivage pour permettre le recalcul des écarts historiques.</p>
                <p><strong>Import :</strong> saisie en masse via fichier CSV/Excel pour les grandes nomenclatures.</p>
            </div>
        </div>
    );
}
