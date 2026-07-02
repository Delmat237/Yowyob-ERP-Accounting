"use client";

import { useState } from "react";
import {
    mockPrixCessions, mockCentres, mockUnitesOeuvre,
    PrixCessionInterne, MethodeCession,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, AlertTriangle, Clock, History } from "lucide-react";

const METHODE_CONFIG: Record<MethodeCession, { label: string; desc: string; color: string }> = {
    COUT_COMPLET: { label: "Coût complet", desc: "Valorisé au coût complet calculé", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    PRIX_MARCHE: { label: "Prix de marché", desc: "Référence au prix externe du marché", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    PRIX_CONVENTIONNEL: { label: "Prix conventionnel", desc: "Tarif fixé par convention interne", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function Modal({
    initial, onClose, onSave,
}: { initial?: Partial<PrixCessionInterne>; onClose: () => void; onSave: (d: PrixCessionInterne) => void }) {
    const [form, setForm] = useState<Partial<PrixCessionInterne>>({
        methode: "COUT_COMPLET", prixUnitaire: 0, dateDebut: new Date().toISOString().slice(0, 10),
        hasImputations: false, versions: [], ...initial,
    });

    const isEdit = !!initial?.id;
    const priceChanged = isEdit && initial?.prixUnitaire !== form.prixUnitaire;
    const valid = !!form.centreCedantId && !!form.centreBeneficiaireId && !!form.prestationLibelle?.trim() && (form.prixUnitaire ?? 0) > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
                    <h2 className="text-base font-bold">{isEdit ? "Modifier le prix de cession" : "Nouveau prix de cession interne"}</h2>
                    <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Centre cédant *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.centreCedantId ?? ""}
                                onChange={(e) => {
                                    const c = mockCentres.find((x) => x.id === e.target.value);
                                    setForm({ ...form, centreCedantId: e.target.value, centreCedantLibelle: c?.libelle });
                                }}>
                                <option value="">— Sélectionner —</option>
                                {mockCentres.filter((c) => c.actif).map((c) => (
                                    <option key={c.id} value={c.id}>{c.libelle}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Centre bénéficiaire *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.centreBeneficiaireId ?? ""}
                                onChange={(e) => {
                                    const c = mockCentres.find((x) => x.id === e.target.value);
                                    setForm({ ...form, centreBeneficiaireId: e.target.value, centreBeneficiaireLibelle: c?.libelle });
                                }}>
                                <option value="">— Sélectionner —</option>
                                {mockCentres.filter((c) => c.actif && c.id !== form.centreCedantId).map((c) => (
                                    <option key={c.id} value={c.id}>{c.libelle}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Prestation / Produit *</label>
                        <input className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            placeholder="Ex: Maintenance machines, Transport…"
                            value={form.prestationLibelle ?? ""} onChange={(e) => setForm({ ...form, prestationLibelle: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Unité *</label>
                            <select className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.uniteId ?? ""}
                                onChange={(e) => {
                                    const u = mockUnitesOeuvre.find((x) => x.id === e.target.value);
                                    setForm({ ...form, uniteId: e.target.value, uniteLibelle: u?.libelle });
                                }}>
                                <option value="">— Sélectionner —</option>
                                {mockUnitesOeuvre.map((u) => (
                                    <option key={u.id} value={u.id}>{u.libelle} ({u.uniteMesure})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Prix unitaire (FCFA) *</label>
                            <input type="number" min={0}
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.prixUnitaire ?? 0} onChange={(e) => setForm({ ...form, prixUnitaire: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Méthode de valorisation *</label>
                        <div className="space-y-2">
                            {(["COUT_COMPLET", "PRIX_MARCHE", "PRIX_CONVENTIONNEL"] as MethodeCession[]).map((m) => {
                                const cfg = METHODE_CONFIG[m];
                                return (
                                    <button key={m} type="button" onClick={() => setForm((f) => ({ ...f, methode: m }))}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl border transition-colors ${form.methode === m ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                                        <span className="text-sm font-semibold">{cfg.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">{cfg.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Date début *</label>
                            <input type="date" className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.dateDebut ?? ""} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Date fin (optionnel)</label>
                            <input type="date" className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.dateFin ?? ""} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
                        </div>
                    </div>
                    {priceChanged && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-800 flex gap-2">
                            <History className="h-4 w-4 flex-shrink-0" />
                            Le changement de prix génèrera une nouvelle version datée dans l&apos;historique.
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button disabled={!valid}
                        onClick={() => {
                            const newVersions = priceChanged
                                ? [{ prixUnitaire: initial!.prixUnitaire!, du: initial!.dateDebut!, au: new Date().toISOString().slice(0, 10), methode: initial!.methode! }, ...(initial?.versions ?? [])]
                                : (form.versions ?? []);
                            onSave({
                                id: form.id ?? `pc-${Date.now()}`,
                                centreCedantId: form.centreCedantId!, centreCedantLibelle: form.centreCedantLibelle!,
                                centreBeneficiaireId: form.centreBeneficiaireId!, centreBeneficiaireLibelle: form.centreBeneficiaireLibelle!,
                                prestationLibelle: form.prestationLibelle!, methode: form.methode!,
                                prixUnitaire: form.prixUnitaire!, uniteId: form.uniteId!, uniteLibelle: form.uniteLibelle!,
                                dateDebut: form.dateDebut!, dateFin: form.dateFin,
                                hasImputations: form.hasImputations ?? false, versions: newVersions,
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50">
                        {isEdit ? "Enregistrer" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PrixCessionsPage() {
    const [cessions, setCessions] = useState<PrixCessionInterne[]>(mockPrixCessions);
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<PrixCessionInterne> }>({ open: false });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState<string | null>(null);

    function handleSave(data: PrixCessionInterne) {
        setCessions((p) => p.find((c) => c.id === data.id) ? p.map((c) => c.id === data.id ? data : c) : [...p, data]);
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {modal.open && <Modal initial={modal.initial} onClose={() => setModal({ open: false })} onSave={handleSave} />}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm mx-4 p-6">
                        <h3 className="font-bold mb-2">Supprimer ce prix de cession ?</h3>
                        {cessions.find((c) => c.id === deleteId)?.hasImputations ? (
                            <p className="text-sm text-rose-600 mb-4">Impossible — des imputations ont déjà utilisé ce tarif.</p>
                        ) : (
                            <p className="text-sm text-muted-foreground mb-4">Cette action est irréversible.</p>
                        )}
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Fermer</button>
                            {!cessions.find((c) => c.id === deleteId)?.hasImputations && (
                                <button onClick={() => { setCessions((p) => p.filter((c) => c.id !== deleteId)); setDeleteId(null); }}
                                    className="px-4 py-2 text-sm rounded-xl bg-destructive text-destructive-foreground">Supprimer</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Prix de Cessions Internes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Valorisation des échanges inter-centres (Paramétrage 8)</p>
                </div>
                <button onClick={() => setModal({ open: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm">
                    <Plus className="h-4 w-4" /> Nouveau tarif
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Tarifs actifs", val: cessions.filter((c) => !c.dateFin).length, color: "text-emerald-700" },
                    { label: "Avec imputations", val: cessions.filter((c) => c.hasImputations).length, color: "text-amber-600" },
                    { label: "Versions historisées", val: cessions.reduce((s, c) => s + c.versions.length, 0), color: "text-indigo-600" },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-sm">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {cessions.map((c) => {
                    const cfg = METHODE_CONFIG[c.methode];
                    const isExpired = c.dateFin && c.dateFin < new Date().toISOString().slice(0, 10);
                    return (
                        <div key={c.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${isExpired ? "border-muted opacity-60" : "border-border"}`}>
                            <div className="flex items-start justify-between p-5 gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-bold text-foreground">{c.prestationLibelle}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
                                        {isExpired && <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-full text-[10px] font-bold">Expiré</span>}
                                        {c.hasImputations && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">Utilisé</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                        <span className="font-medium text-indigo-700">{c.centreCedantLibelle}</span>
                                        <span>→</span>
                                        <span className="font-medium text-cyan-700">{c.centreBeneficiaireLibelle}</span>
                                        <span>·</span>
                                        <span className="font-mono font-bold text-foreground">{formatCurrency(c.prixUnitaire)}</span>
                                        <span>/{c.uniteLibelle}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Valide du {c.dateDebut}{c.dateFin ? ` au ${c.dateFin}` : " (sans échéance)"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {c.versions.length > 0 && (
                                        <button onClick={() => setShowHistory(showHistory === c.id ? null : c.id)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary">
                                            <Clock className="h-3.5 w-3.5" /> {c.versions.length} version(s)
                                        </button>
                                    )}
                                    <button onClick={() => setModal({ open: true, initial: c })}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setDeleteId(c.id)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                            {showHistory === c.id && c.versions.length > 0 && (
                                <div className="border-t border-border px-5 py-3 bg-muted/20">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Historique des tarifs</p>
                                    <div className="space-y-1.5">
                                        {c.versions.map((v, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs bg-card border border-border rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${METHODE_CONFIG[v.methode].color}`}>{METHODE_CONFIG[v.methode].label}</span>
                                                    <span className="text-muted-foreground">{v.du} → {v.au}</span>
                                                </div>
                                                <span className="font-mono font-bold">{formatCurrency(v.prixUnitaire)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-muted/20 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-sm mb-1">Règles métier</p>
                <p><strong>Historisation automatique :</strong> tout changement de prix génère une nouvelle version datée conservée dans l&apos;historique.</p>
                <p><strong>Suppression conditionnelle :</strong> impossible si des imputations ont déjà utilisé ce tarif.</p>
                <p><strong>Unicité :</strong> une seule règle active par couple cédant/bénéficiaire/prestation.</p>
            </div>
        </div>
    );
}
