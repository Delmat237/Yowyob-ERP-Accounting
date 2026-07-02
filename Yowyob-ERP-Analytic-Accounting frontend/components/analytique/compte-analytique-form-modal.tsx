"use client";

import { useState } from "react";
import { CompteAnalytique, ClasseAnalytique } from "@/lib/mock-data";
import { X, Hash, AlertTriangle } from "lucide-react";

interface CompteFormModalProps {
    initial?: Partial<CompteAnalytique>;
    onClose: () => void;
    onSave: (data: Partial<CompteAnalytique>) => void;
}

const CLASS_LABELS: Record<ClasseAnalytique, string> = {
    "90": "Classe 90 — Comptes de réfléchissement",
    "92": "Classe 92 — Centres d'analyse (Sections)",
    "94": "Classe 94 — Inventaire permanent (Stocks)",
    "97": "Classe 97 — Résultats analytiques"
};

export function CompteAnalytiqueFormModal({ initial, onClose, onSave }: CompteFormModalProps) {
    const [form, setForm] = useState<Partial<CompteAnalytique>>({
        numero: "",
        libelle: "",
        classe: "92",
        actif: true,
        description: "",
        dateDebut: "",
        dateFin: "",
        ...initial,
    });

    const isEdit = !!initial?.id;

    // Déduit la classe depuis le numéro de compte en direct, ou s'assure de la cohérence
    function handleNumeroChange(val: string) {
        const num = val.replace(/\D/g, '').substring(0, 6); // Max 6 chiffres, only digits

        let newClasse = form.classe;
        if (num.startsWith("90")) newClasse = "90";
        else if (num.startsWith("92")) newClasse = "92";
        else if (num.startsWith("94")) newClasse = "94";
        else if (num.startsWith("97")) newClasse = "97";

        setForm(f => ({ ...f, numero: num, classe: newClasse }));
    }

    const valid = !!form.numero && form.numero.length >= 4 && form.numero.startsWith("9") && !!form.libelle?.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold text-foreground">
                        {isEdit ? "Modifier le compte" : "Nouveau compte analytique"}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6 space-y-4">

                    {/* Numéro de compte */}
                    <div>
                        <label className="text-sm font-medium text-foreground">Numéro de compte *</label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <input
                                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                                value={form.numero}
                                onChange={(e) => handleNumeroChange(e.target.value)}
                                placeholder="921000"
                                disabled={isEdit}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Doit commencer par 90, 92, 94 ou 97 et comporter au moins 4 chiffres.</p>

                        {form.numero && !form.numero.startsWith("9") && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
                                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                Le numéro doit obligatoirement commencer par 9.
                            </div>
                        )}
                        {form.numero && form.numero.startsWith("9") && !["90", "92", "94", "97"].includes(form.numero.substring(0, 2)) && form.numero.length >= 2 && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                Classe OHADA inattendue (attendue: 90, 92, 94, 97).
                            </div>
                        )}
                    </div>

                    {/* Classe dérivée */}
                    {form.classe && (
                        <div className="px-3 py-2 bg-secondary/50 rounded-lg border border-border/50 text-xs text-muted-foreground">
                            {CLASS_LABELS[form.classe] || "Classe non standard"}
                        </div>
                    )}

                    {/* Libellé */}
                    <div>
                        <label className="text-sm font-medium text-foreground">Libellé du compte *</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                            value={form.libelle ?? ""}
                            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                            placeholder="Ex: Section - Atelier de Montage"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-foreground">Description (Optionnel)</label>
                        <textarea
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none resize-none h-16"
                            value={form.description ?? ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Détails du périmètre couvert par ce compte…"
                        />
                    </div>

                    {/* Validité */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-foreground">Début validité</label>
                            <input
                                type="date"
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.dateDebut ?? ""}
                                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Fin validité</label>
                            <input
                                type="date"
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.dateFin ?? ""}
                                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Statut Actif */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, actif: !form.actif })}
                            className={`relative w-10 h-5 rounded-full transition-colors ${form.actif ? "bg-primary" : "bg-muted-foreground/30"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.actif ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <label className="text-sm font-medium text-foreground">
                            Compte {form.actif ? "actif" : "inactif"}
                        </label>
                    </div>

                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        disabled={!valid}
                        onClick={() => { onSave(form); onClose(); }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-50"
                    >
                        {isEdit ? "Enregistrer" : "Créer le compte"}
                    </button>
                </div>
            </div>
        </div>
    );
}
