"use client";

import { useState } from "react";
import { mockUnitesOeuvre, mockCentres, UniteOeuvre, NatureUO } from "@/lib/mock-data";
import { Plus, Pencil, Trash2, X, AlertTriangle, Ruler } from "lucide-react";
import { FloatingModal } from "@/components/ui/floating-modal";

const NATURE_LABELS: Record<NatureUO, string> = {
    PHYSIQUE: "Physique",
    MONETAIRE: "Monétaire",
};


export default function UnitesOeuvrePage() {
    const [unites, setUnites] = useState<UniteOeuvre[]>(mockUnitesOeuvre);
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<UniteOeuvre> }>({ open: false });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const getCentreLibelle = (id: string) => mockCentres.find((c) => c.id === id)?.libelle ?? id;

    function handleSave(data: UniteOeuvre) {
        setUnites((p) => p.find((u) => u.id === data.id) ? p.map((u) => u.id === data.id ? data : u) : [...p, data]);
    }

    function handleDelete(id: string) {
        const uo = unites.find((u) => u.id === id);
        if (uo?.centresLies && uo.centresLies.length > 0) return; // impossible si centres liés
        setUnites((p) => p.filter((u) => u.id !== id));
        setDeleteId(null);
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {modal.open && <Modal initial={modal.initial} onClose={() => setModal({ open: false })} onSave={handleSave} />}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6">
                        <h3 className="font-bold mb-2">Supprimer cette unité d&apos;œuvre ?</h3>
                        {unites.find((u) => u.id === deleteId)?.centresLies?.length ? (
                            <p className="text-sm text-rose-600 mb-4">Impossible — cette unité est rattachée à des centres d&apos;analyse. Dissociez-la d&apos;abord.</p>
                        ) : (
                            <p className="text-sm text-muted-foreground mb-4">Cette action est irréversible.</p>
                        )}
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary transition-colors">Fermer</button>
                            {!unites.find((u) => u.id === deleteId)?.centresLies?.length && (
                                <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors">Supprimer</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Unités d&apos;Œuvre</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Grandeurs de mesure de l&apos;activité des centres d&apos;analyse</p>
                </div>
                <button onClick={() => setModal({ open: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm transition-all active:scale-95">
                    <Plus className="h-4 w-4" /> Nouvelle unité
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Total unités", val: unites.length, color: "text-primary" },
                    { label: "Physiques", val: unites.filter((u) => u.nature === "PHYSIQUE").length, color: "text-indigo-600" },
                    { label: "Monétaires", val: unites.filter((u) => u.nature === "MONETAIRE").length, color: "text-cyan-600" },
                    { label: "Total calculs actifs", val: unites.filter((u) => u.hasCalculs).length, color: "text-amber-600" },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-sm">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>{["Code", "Libellé", "Volume Prévu", "Nature", "Centres liés", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {unites.map((u) => (
                                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                                        <div className="px-2 py-0.5 bg-muted rounded border border-border inline-block">{u.code}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <Ruler className="h-3.5 w-3.5 text-primary" />
                                                {u.libelle}
                                            </div>
                                            {u.description && <span className="text-[10px] text-muted-foreground line-clamp-1 italic mt-0.5">{u.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-mono text-xs">
                                        {u.volumePrevuPeriode ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-600">{u.volumePrevuPeriode.toLocaleString()}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase">{u.uniteMesure}</span>
                                            </div>
                                        ) : <span className="text-muted-foreground italic">Non défini</span>}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${u.nature === "PHYSIQUE" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-cyan-50 text-cyan-700 border-cyan-200"}`}>
                                            {NATURE_LABELS[u.nature]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {u.centresLies.map((id) => (
                                                <span key={id} className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium border border-border/50">{getCentreLibelle(id)}</span>
                                            ))}
                                            {u.centresLies.length === 0 && <span className="text-xs text-muted-foreground italic">Aucun centre</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => setModal({ open: true, initial: u })} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4 text-[11px] text-muted-foreground space-y-2">
                <p className="font-bold text-foreground text-xs uppercase tracking-wider mb-1">Règles métier & Cohérence</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Modification restreinte :</strong> le libellé et la nature sont verrouillés si des calculs de coûts ont déjà utilisé cette unité pour garantir la traçabilité historique.</p>
                    <p><strong>Suppression impossible :</strong> si au moins un centre d&apos;analyse est rattaché à cette unité, afin d&apos;éviter les ruptures de chaîne de valeur dans les calculs de coûts.</p>
                </div>
            </div>
        </div>
    );
}

function Modal({
    initial, onClose, onSave,
}: { initial?: Partial<UniteOeuvre>; onClose: () => void; onSave: (d: UniteOeuvre) => void }) {
    const [form, setForm] = useState<Partial<UniteOeuvre>>({
        code: "", libelle: "", nature: "PHYSIQUE", uniteMesure: "", centresLies: [], hasCalculs: false, description: "", volumePrevuPeriode: 0, ...initial,
    });

    const isEdit = !!initial?.id;
    const blocked = isEdit && (initial?.hasCalculs ?? false);
    const valid = !!form.code?.trim() && !!form.libelle?.trim() && !!form.uniteMesure?.trim();

    function toggleCentre(id: string) {
        setForm((f) => {
            const list = f.centresLies ?? [];
            return { ...f, centresLies: list.includes(id) ? list.filter((c) => c !== id) : [...list, id] };
        });
    }

    return (
        <FloatingModal
            title={isEdit ? "Modifier l'unité d'œuvre" : "Nouvelle unité d'œuvre"}
            subtitle="Configuration des Unités d'Oeuvre"
            icon={<Ruler className="h-4 w-4" />}
            onClose={onClose}
            accentColor="bg-indigo-600"
            footer={
                <div className="flex justify-end gap-3 px-6 py-4 bg-muted/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary font-medium transition-colors">Annuler</button>
                    <button
                        disabled={!valid}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `uo-${Date.now()}`,
                                code: form.code!,
                                libelle: form.libelle!,
                                nature: form.nature!,
                                uniteMesure: form.uniteMesure!,
                                centresLies: form.centresLies ?? [],
                                hasCalculs: form.hasCalculs ?? false,
                                description: form.description,
                                volumePrevuPeriode: form.volumePrevuPeriode
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                        {isEdit ? "Enregistrer les modifications" : "Créer l'unité d'œuvre"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {blocked && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-[11px] text-amber-800">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        Le libellé et la nature sont verrouillés car des calculs de coûts réels utilisent déjà cette unité.
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Code *</label>
                            <input
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                                placeholder="Ex: HM"
                                value={form.code ?? ""}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                disabled={isEdit}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Unité de mesure *</label>
                            <input
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="h, kg, €, %…"
                                value={form.uniteMesure ?? ""}
                                onChange={(e) => setForm({ ...form, uniteMesure: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Libellé *</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                            placeholder="Ex: Heure Machine"
                            value={form.libelle ?? ""}
                            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                            disabled={blocked}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Nature *</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                                value={form.nature ?? "PHYSIQUE"}
                                onChange={(e) => setForm({ ...form, nature: e.target.value as NatureUO })}
                                disabled={blocked}
                            >
                                <option value="PHYSIQUE">Physique (heure, kg…)</option>
                                <option value="MONETAIRE">Monétaire (% CA, % coût…)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Volume Prévu / période</label>
                            <input
                                type="number"
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.volumePrevuPeriode ?? 0}
                                onChange={(e) => setForm({ ...form, volumePrevuPeriode: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Description / Formule de calcul</label>
                        <textarea
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none h-20 resize-none"
                            placeholder="Détails sur l'unité ou formule pour les unités monétaires..."
                            value={form.description ?? ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Centres d&apos;analyse associés</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                            {mockCentres.filter((c) => c.actif).map((c) => (
                                <button key={c.id} type="button" onClick={() => toggleCentre(c.id)}
                                    className={`px-3 py-1.5 text-[11px] rounded-full border font-bold transition-all ${(form.centresLies ?? []).includes(c.id) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                                    {c.libelle}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </FloatingModal>
    );
}
