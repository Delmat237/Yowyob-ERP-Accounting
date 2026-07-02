"use client";

import { useState } from "react";
import { AxeAnalytique, TypeAxe, UniteOeuvre } from "@/lib/analytique/mock-data";
import { AlertTriangle } from "lucide-react";
import { FloatingModal } from "@/components/ui/floating-modal";

interface AxeFormModalProps {
    initial?: Partial<AxeAnalytique>;
    onClose: () => void;
    onSave: (data: Partial<AxeAnalytique>) => void;
    allAxes?: AxeAnalytique[];
    unitesOeuvre?: UniteOeuvre[];
}

export function AxeFormModal({ initial, onClose, onSave, allAxes = [], unitesOeuvre = [] }: AxeFormModalProps) {
    const [form, setForm] = useState<Partial<AxeAnalytique>>({
        code: "",
        libelle: "",
        type: "PRINCIPAL",
        actif: true,
        compteAnalytique9x: "",
        uniteOeuvreId: "",
        dateDebut: "",
        dateFin: "",
        description: "",
        ...initial,
    });

    const isEdit = !!initial?.id;
    const isSubAxe = !!form.parentId;

    // Axes parents éligibles (exclure lui-même et ses enfants)
    const eligibleParents = allAxes.filter(
        (a) => a.id !== initial?.id && !a.parentId // seulement les racines comme parents pour éviter trop de niveaux
    );

    const valid = !!form.code?.trim() && !!form.libelle?.trim();

    return (
        <FloatingModal
            title={isEdit ? "Modifier l'axe d'analyse" : isSubAxe ? "Nouveau sous-axe" : "Nouvel axe d'analyse"}
            subtitle={isSubAxe ? `Sous-axe de : ${allAxes.find((a) => a.id === form.parentId)?.libelle ?? form.parentId}` : undefined}
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl border border-slate-300 text-muted-foreground hover:bg-slate-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        disabled={!valid}
                        onClick={() => { onSave(form); onClose(); }}
                        className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                    >
                        {isEdit ? "Enregistrer" : isSubAxe ? "Créer le sous-axe" : "Créer l'axe"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* ── Section : Identification ── */}
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Identification</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Code *</label>
                                    <input
                                        className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                                        value={form.code ?? ""}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="AXE-DEPT"
                                        disabled={isEdit}
                                    />
                                    {isEdit && <p className="text-[10px] text-muted-foreground mt-0.5">Le code ne peut pas être modifié</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Type *</label>
                                    <div className="mt-1 flex gap-2">
                                        {(["PRINCIPAL", "AUXILIAIRE"] as TypeAxe[]).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setForm({ ...form, type: t })}
                                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${form.type === t
                                                    ? t === "PRINCIPAL"
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "bg-cyan-600 text-white border-cyan-600"
                                                    : "border-border text-muted-foreground hover:bg-secondary"}`}
                                            >
                                                {t === "PRINCIPAL" ? "Principal" : "Auxiliaire"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Libellé *</label>
                                <input
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={form.libelle ?? ""}
                                    onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                                    placeholder="Ex: Département"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Description</label>
                                <textarea
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none resize-none h-16"
                                    value={form.description ?? ""}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Note libre sur cet axe d'analyse…"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Section : Hiérarchie ── */}
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Hiérarchie</p>
                        <div>
                            <label className="text-sm font-medium text-foreground">Axe parent</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.parentId ?? ""}
                                onChange={(e) => setForm({ ...form, parentId: e.target.value || undefined })}
                            >
                                <option value="">— Aucun (axe racine) —</option>
                                {eligibleParents.map((a) => (
                                    <option key={a.id} value={a.id}>{a.code} — {a.libelle}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Laissez vide pour un axe de premier niveau (racine).
                            </p>
                        </div>
                    </div>

                    {/* ── Section : Paramètres analytiques ── */}
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Paramètres analytiques</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-foreground">Compte analytique (Classe 9)</label>
                                <input
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                                    value={form.compteAnalytique9x ?? ""}
                                    onChange={(e) => setForm({ ...form, compteAnalytique9x: e.target.value })}
                                    placeholder="Ex: 9100, 9200…"
                                    maxLength={10}
                                />
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Compte OHADA de classe 9 rattaché pour les écritures analytiques.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Unité d&apos;Œuvre par défaut</label>
                                <select
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={form.uniteOeuvreId ?? ""}
                                    onChange={(e) => setForm({ ...form, uniteOeuvreId: e.target.value || undefined })}
                                >
                                    <option value="">— Aucune —</option>
                                    {unitesOeuvre.map((u) => (
                                        <option key={u.id} value={u.id}>{u.libelle} ({u.uniteMesure})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Section : Période de validité ── */}
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Période de validité</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-foreground">Date de début</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={form.dateDebut ?? ""}
                                    onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Date de fin</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={form.dateFin ?? ""}
                                    onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground mt-0.5">Vide = sans limite</p>
                            </div>
                        </div>
                        {form.dateFin && form.dateDebut && form.dateFin < form.dateDebut && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                La date de fin est antérieure à la date de début.
                            </div>
                        )}
                    </div>

                    {/* ── Statut ── */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, actif: !form.actif })}
                            className={`relative w-10 h-5 rounded-full transition-colors ${form.actif ? "bg-primary" : "bg-muted-foreground/30"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.actif ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <label className="text-sm font-medium text-foreground">
                            Axe {form.actif ? "actif" : "inactif"}
                        </label>
                    </div>
                </div>
        </FloatingModal>
    );
}
