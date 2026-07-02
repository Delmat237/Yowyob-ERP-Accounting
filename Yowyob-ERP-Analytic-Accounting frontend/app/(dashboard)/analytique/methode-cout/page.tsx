"use client";

import { useState } from "react";
import {
    mockMethodesCalcul, mockPlansAnalytiques, mockCentres,
    MethodeCalculCoût, MethodeCalculCout, ActiviteNormale,
} from "@/lib/mock-data";
import { Plus, Pencil, X, AlertTriangle, CheckCircle2, Lock, FileSpreadsheet } from "lucide-react";
import { FloatingModal } from "@/components/ui/floating-modal";

const METHODE_CONFIG: Record<MethodeCalculCout, { label: string; charges: string; resultat: string; color: string }> = {
    COUTS_COMPLETS: { label: "Coûts Complets", charges: "Toutes (directes + indirectes)", resultat: "Résultat analytique complet", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    COUTS_VARIABLES: { label: "Coûts Variables", charges: "Charges variables uniquement", resultat: "Marge sur coût variable", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    IMPUTATION_RATIONNELLE: { label: "Imputation Rationnelle", charges: "Variables + fixes × coeff. activité", resultat: "Coût rationnel + différence d'imputation", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    COUTS_DIRECTS: { label: "Coûts Directs", charges: "Charges directement traçables", resultat: "Marge sur coût direct", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

function Modal({
    initial, onClose, onSave,
}: { initial?: Partial<MethodeCalculCoût>; onClose: () => void; onSave: (d: MethodeCalculCoût) => void }) {
    const [form, setForm] = useState<Partial<MethodeCalculCoût>>({
        methode: "COUTS_COMPLETS", planAnalytiqueId: "plan-2026", dateApplication: new Date().toISOString().slice(0, 10),
        statut: "ACTIF", activitesNormales: [], description: "", ...initial,
    });

    const isEdit = !!initial?.id;
    const isIR = form.methode === "IMPUTATION_RATIONNELLE";
    const valid = !!form.planAnalytiqueId && !!form.dateApplication && !!form.methode;

    function updateActivite(centreId: string, val: number) {
        setForm((f) => {
            const list = f.activitesNormales ?? [];
            const centre = mockCentres.find((c) => c.id === centreId);
            const exists = list.find((a) => a.centreId === centreId);
            if (exists) return { ...f, activitesNormales: list.map((a) => a.centreId === centreId ? { ...a, activiteNormale: val } : a) };
            return { ...f, activitesNormales: [...list, { centreId, centreLibelle: centre?.libelle ?? centreId, activiteNormale: val, unite: centre?.uniteOeuvre ?? "" }] };
        });
    }

    function getActivite(centreId: string) {
        return form.activitesNormales?.find((a) => a.centreId === centreId)?.activiteNormale ?? 0;
    }

    return (
        <FloatingModal
            title={isEdit ? "Modifier la configuration" : "Nouvelle méthode de calcul"}
            subtitle="Application de la méthode OHADA"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            onClose={onClose}
            accentColor="bg-amber-600"
            footer={
                <div className="flex justify-end gap-3 px-6 py-4 bg-muted/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary font-medium transition-colors">Annuler</button>
                    <button
                        disabled={!valid}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `mc-${Date.now()}`,
                                methode: form.methode!,
                                planAnalytiqueId: form.planAnalytiqueId!,
                                dateApplication: form.dateApplication!,
                                statut: "ACTIF",
                                activitesNormales: form.activitesNormales ?? [],
                                description: form.description ?? ""
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                        {isEdit ? "Mettre à jour" : "Activer la méthode"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Plan Analytique *</label>
                            <select className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.planAnalytiqueId ?? ""} onChange={(e) => setForm({ ...form, planAnalytiqueId: e.target.value })}>
                                {mockPlansAnalytiques.map((p) => (
                                    <option key={p.id} value={p.id}>{p.code} — {p.libelle}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Date d&apos;application *</label>
                            <input type="date" className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.dateApplication ?? ""} onChange={(e) => setForm({ ...form, dateApplication: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Méthode de calcul OHADA/Melyon *</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(METHODE_CONFIG) as MethodeCalculCout[]).map((m) => {
                                const cfg = METHODE_CONFIG[m];
                                const selected = form.methode === m;
                                return (
                                    <button key={m} type="button" onClick={() => setForm((f) => ({ ...f, methode: m }))}
                                        className={`text-left p-4 rounded-2xl border transition-all shadow-sm ${selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-secondary"}`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-foreground">{cfg.label}</p>
                                            {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{cfg.charges}</p>
                                        <p className="text-[9px] text-primary font-medium mt-0.5">{cfg.resultat}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {isIR && (
                        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-emerald-700" />
                                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Activités normales par centre</p>
                            </div>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {mockCentres.filter((c) => c.actif).map((c) => (
                                    <div key={c.id} className="flex items-center justify-between gap-3 p-2 bg-white/50 rounded-xl border border-emerald-100">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-emerald-900 truncate">{c.libelle}</p>
                                            <p className="text-[10px] text-emerald-600 font-medium">Unité : {c.uniteOeuvre}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" min={0}
                                                className="w-24 text-xs border border-emerald-200 rounded-lg px-2 py-1.5 bg-white text-right focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
                                                value={getActivite(c.id)} onChange={(e) => updateActivite(c.id, Number(e.target.value))} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-emerald-700 italic">Ces valeurs servent de base au calcul du coefficient d&apos;Imputation Rationnelle (Activité Réelle / Activité Normale).</p>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Observations / Note de gestion</label>
                        <textarea className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input h-20 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Détaillez les raisons du choix de cette méthode ou les spécificités d'application..."
                            value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        {isEdit && <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1"><Lock className="h-3 w-3" /> Note : Le changement de méthode en cours d&apos;exercice est fortement déconseillé.</p>}
                    </div>
                </div>
            </div>
        </FloatingModal>
    );
}

export default function MethodeCoutPage() {
    const [methodes, setMethodes] = useState<MethodeCalculCoût[]>(mockMethodesCalcul);
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<MethodeCalculCoût> }>({ open: false });

    function handleSave(data: MethodeCalculCoût) {
        setMethodes((p) => {
            // Si on active une méthode, on archive les autres pour ce plan
            const updated = data.statut === "ACTIF"
                ? p.map((m) => m.planAnalytiqueId === data.planAnalytiqueId ? { ...m, statut: "ARCHIVE" as const } : m)
                : p;

            return updated.find((m) => m.id === data.id)
                ? updated.map((m) => m.id === data.id ? data : m)
                : [...updated, data];
        });
    }

    const active = methodes.filter((m) => m.statut === "ACTIF");
    const archived = methodes.filter((m) => m.statut === "ARCHIVE");

    return (
        <div className="space-y-6 animate-fade-in-up">
            {modal.open && <Modal initial={modal.initial} onClose={() => setModal({ open: false })} onSave={handleSave} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Méthode de Calcul des Coûts</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Logique générale de calcul appliquée au module (Paramétrage 7)</p>
                </div>
                <button onClick={() => setModal({ open: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm">
                    <Plus className="h-4 w-4" /> Nouvelle méthode
                </button>
            </div>

            {/* Tableau comparatif */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20">
                    <h3 className="text-sm font-bold">Comparatif des méthodes disponibles</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>{["Méthode", "Charges incorporées", "Résultat calculé"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody>
                            {(Object.entries(METHODE_CONFIG) as [MethodeCalculCout, typeof METHODE_CONFIG[MethodeCalculCout]][]).map(([key, cfg]) => (
                                <tr key={key} className="border-b border-border/50">
                                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-xl text-xs font-bold border ${cfg.color}`}>{cfg.label}</span></td>
                                    <td className="px-4 py-3 text-muted-foreground">{cfg.charges}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{cfg.resultat}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Méthodes actives */}
            <div>
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Méthodes actives ({active.length})</h2>
                <div className="space-y-3">
                    {active.map((m) => {
                        const cfg = METHODE_CONFIG[m.methode];
                        const plan = mockPlansAnalytiques.find((p) => p.id === m.planAnalytiqueId);
                        return (
                            <div key={m.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-xl text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
                                            <span className="text-xs text-muted-foreground">Plan : {plan?.libelle ?? m.planAnalytiqueId}</span>
                                            <span className="text-xs text-muted-foreground">· Depuis le {m.dateApplication}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{m.description}</p>
                                        {m.methode === "IMPUTATION_RATIONNELLE" && m.activitesNormales.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {m.activitesNormales.map((a) => (
                                                    <span key={a.centreId} className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                                                        <strong>{a.centreLibelle}</strong> — {a.activiteNormale} {a.unite}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => setModal({ open: true, initial: m })}
                                        className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary flex-shrink-0">
                                        <Pencil className="h-3.5 w-3.5" /> Modifier
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Méthodes archivées */}
            {archived.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2"><Lock className="h-4 w-4" /> Méthodes archivées ({archived.length})</h2>
                    <div className="space-y-2">
                        {archived.map((m) => {
                            const cfg = METHODE_CONFIG[m.methode];
                            return (
                                <div key={m.id} className="bg-muted/20 rounded-xl border border-border p-4 flex items-center justify-between opacity-70">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-xl text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
                                        <span className="text-xs text-muted-foreground">{m.description}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Depuis {m.dateApplication}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                    <p className="font-bold">Règle : une seule méthode active par plan analytique</p>
                    <p>Le changement de méthode n&apos;est autorisé qu&apos;en début d&apos;exercice. La méthode précédente est automatiquement archivée. Suppression impossible — archivage uniquement.</p>
                </div>
            </div>
        </div>
    );
}
