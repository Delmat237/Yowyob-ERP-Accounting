"use client";

import { useState } from "react";
import { mockReglesValorisationStock, RegleValorisationStock, MethodeValorisation } from "@/lib/mock-data";
import { Plus, Pencil, X, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

const METHODE_CONFIG: Record<MethodeValorisation, { label: string; desc: string; color: string }> = {
    CUMP_PERIODE: { label: "CMUP Période", desc: "Calculé en fin de période : (SI + entrées) ÷ (qté SI + qté entrées)", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    CUMP_ENTREE: { label: "CMUP / Entrée", desc: "Recalculé après chaque entrée — plus précis", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    FIFO: { label: "FIFO (PEPS)", desc: "Premières entrées sortent en premier — stock final au coût le plus récent", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    LIFO: { label: "LIFO (DEPS)", desc: "Dernières entrées sortent en premier — pénalise le résultat en inflation", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

function Modal({
    initial, onClose, onSave,
}: { initial?: Partial<RegleValorisationStock>; onClose: () => void; onSave: (d: RegleValorisationStock) => void }) {
    const [form, setForm] = useState<Partial<RegleValorisationStock>>({
        familleLibelle: "", methode: "CUMP_ENTREE", dateApplication: new Date().toISOString().slice(0, 10), actif: true, historique: [], ...initial,
    });

    const isEdit = !!initial?.id;
    const valid = !!form.familleLibelle?.trim() && !!form.methode;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">{isEdit ? "Modifier la méthode" : "Nouvelle règle de valorisation"}</h2>
                    <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium">Famille / Article *</label>
                        <input className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            placeholder="Ex: Matières Premières" value={form.familleLibelle ?? ""}
                            onChange={(e) => setForm({ ...form, familleLibelle: e.target.value })} disabled={isEdit} />
                        {isEdit && <p className="text-xs text-muted-foreground mt-1">Le périmètre ne peut pas être modifié.</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Méthode de valorisation *</label>
                        <div className="space-y-2">
                            {(["CUMP_PERIODE", "CUMP_ENTREE", "FIFO", "LIFO"] as MethodeValorisation[]).map((m) => {
                                const cfg = METHODE_CONFIG[m];
                                return (
                                    <button key={m} type="button" onClick={() => setForm((f) => ({ ...f, methode: m }))}
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${form.methode === m ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                                        <p className="text-sm font-semibold">{cfg.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{cfg.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Date d&apos;application *</label>
                        <input type="date" className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.dateApplication ?? ""} onChange={(e) => setForm({ ...form, dateApplication: e.target.value })} />
                        {isEdit && <p className="text-xs text-amber-600 mt-1">Le changement de méthode doit être effectué en début de période.</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button disabled={!valid}
                        onClick={() => {
                            const prev = initial?.methode !== form.methode && isEdit
                                ? [{ methode: initial!.methode!, du: initial!.dateApplication!, au: new Date().toISOString().slice(0, 10) }, ...(initial?.historique ?? [])]
                                : (form.historique ?? []);
                            onSave({ id: form.id ?? `rvs-${Date.now()}`, familleId: form.familleId ?? `fam-${Date.now()}`, familleLibelle: form.familleLibelle!, methode: form.methode!, dateApplication: form.dateApplication!, actif: form.actif ?? true, historique: prev });
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

export default function ValorisationStocksPage() {
    const [regles, setRegles] = useState<RegleValorisationStock[]>(mockReglesValorisationStock);
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<RegleValorisationStock> }>({ open: false });

    function handleSave(data: RegleValorisationStock) {
        setRegles((p) => p.find((r) => r.id === data.id) ? p.map((r) => r.id === data.id ? data : r) : [...p, data]);
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {modal.open && <Modal initial={modal.initial} onClose={() => setModal({ open: false })} onSave={handleSave} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Valorisation des Stocks</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Méthode de calcul du coût des sorties par famille (Paramétrage 6)</p>
                </div>
                <button onClick={() => setModal({ open: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm">
                    <Plus className="h-4 w-4" /> Nouvelle règle
                </button>
            </div>

            {/* Cartes méthodes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["CUMP_PERIODE", "CUMP_ENTREE", "FIFO", "LIFO"] as MethodeValorisation[]).map((m) => {
                    const cfg = METHODE_CONFIG[m];
                    const count = regles.filter((r) => r.methode === m && r.actif).length;
                    return (
                        <div key={m} className={`rounded-xl border p-4 shadow-sm ${cfg.color}`}>
                            <p className="text-xs font-bold uppercase">{cfg.label}</p>
                            <p className="text-2xl font-bold mt-1">{count}</p>
                            <p className="text-[10px] mt-0.5 opacity-70">famille(s) active(s)</p>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-4">
                {regles.map((r) => {
                    const cfg = METHODE_CONFIG[r.methode];
                    return (
                        <div key={r.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="flex items-start justify-between p-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-bold">{r.familleLibelle}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
                                        {r.actif
                                            ? <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold"><CheckCircle2 className="h-3 w-3" />Active</span>
                                            : <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-full text-[10px] font-bold">Archivée</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                                    <p className="text-xs text-muted-foreground mt-1">En vigueur depuis le {r.dateApplication}</p>
                                </div>
                                <button onClick={() => setModal({ open: true, initial: r })}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary">
                                    <Pencil className="h-3.5 w-3.5" /> Modifier
                                </button>
                            </div>
                            {r.historique.length > 0 && (
                                <div className="border-t border-border px-5 py-3 bg-muted/20">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Clock className="h-3 w-3" /> Historique des méthodes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {r.historique.map((h, i) => (
                                            <span key={i} className="px-2 py-1 bg-card border border-border rounded-lg text-xs">
                                                <span className="font-semibold">{METHODE_CONFIG[h.methode].label}</span>
                                                <span className="text-muted-foreground ml-1">({h.du} → {h.au})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                    <p className="font-bold">Règles métier</p>
                    <p>Le changement de méthode de valorisation n&apos;est autorisé qu&apos;en début de période. La méthode historique est conservée pour la consultation. Toute modification génère une nouvelle version datée dans l&apos;historique.</p>
                </div>
            </div>
        </div>
    );
}
