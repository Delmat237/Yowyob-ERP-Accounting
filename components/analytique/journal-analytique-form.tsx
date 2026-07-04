"use client";

import { useState } from "react";
import {
    TYPE_JOURNAL_LABELS,
    COMPTES_REFLET_CLASSE_90,
    generateJournalCode,
    type ExigenceCentreSource,
    type JournalAnalytiqueConfig,
    type TypeJournalAnalytique,
} from "@/lib/analytique/journal-analytique";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";
import { cn } from "@/lib/utils";

const fieldClass =
    "mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none";

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            {children}
        </h3>
    );
}

interface JournalAnalytiqueFormProps {
    initial?: Partial<JournalAnalytiqueConfig>;
    onCancel: () => void;
    onSubmit: (data: JournalAnalytiqueConfig) => void;
}

export function JournalAnalytiqueForm({ initial, onCancel, onSubmit }: JournalAnalytiqueFormProps) {
    const [form, setForm] = useState<JournalAnalytiqueConfig>({
        id: initial?.id ?? `jal-${Date.now()}`,
        code: initial?.code ?? generateJournalCode(),
        libelle: initial?.libelle ?? "",
        type: initial?.type ?? "OPERATIONS_DIRECTES",
        exigenceCentreSource: initial?.exigenceCentreSource ?? "DESACTIVEE",
        compteRefletDefaut: initial?.compteRefletDefaut ?? "900000",
        actif: initial?.actif ?? true,
    });

    const handleTypeChange = (type: TypeJournalAnalytique) => {
        const exigence: ExigenceCentreSource =
            type === "VIREMENTS_RECLASSEMENTS"
                ? "OBLIGATOIRE"
                : type === "CHARGES_SUPPLEMENTAIRES"
                  ? "OPTIONNELLE"
                  : form.exigenceCentreSource === "OBLIGATOIRE"
                    ? "DESACTIVEE"
                    : form.exigenceCentreSource;
        setForm({ ...form, type, exigenceCentreSource: exigence });
    };

    const valid = !!form.libelle.trim() && !!form.type;

    return (
        <ComposeFormShell
            onCancel={onCancel}
            onSubmit={() => onSubmit(form)}
            submitLabel={initial?.id && initial.libelle ? "Enregistrer" : "Créer le journal"}
            disabled={!valid}
        >
            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-800">
                        Configuration : nouveau journal analytique
                    </p>
                </div>

                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <SectionTitle>Identification du registre</SectionTitle>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Libellé du journal *</label>
                            <input
                                className={fieldClass}
                                value={form.libelle}
                                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                                placeholder="Ex: Journal des Reclassements Internes"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SectionTitle>Propriétés et comportement</SectionTitle>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Type de journal *</label>
                            <select
                                className={fieldClass}
                                value={form.type}
                                onChange={(e) => handleTypeChange(e.target.value as TypeJournalAnalytique)}
                            >
                                {(Object.keys(TYPE_JOURNAL_LABELS) as TypeJournalAnalytique[]).map((t) => (
                                    <option key={t} value={t}>
                                        {TYPE_JOURNAL_LABELS[t]}
                                    </option>
                                ))}
                            </select>
                            {form.type === "VIREMENTS_RECLASSEMENTS" && (
                                <p className="text-[10px] text-indigo-600 mt-1">
                                    Active le champ Centre source dans le formulaire de saisie des écritures.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-2">
                                Exigence centre source
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {(["OPTIONNELLE", "OBLIGATOIRE", "DESACTIVEE"] as ExigenceCentreSource[]).map(
                                    (opt) => (
                                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="exigenceCentreSource"
                                                checked={form.exigenceCentreSource === opt}
                                                onChange={() => setForm({ ...form, exigenceCentreSource: opt })}
                                                className="accent-indigo-600"
                                            />
                                            {opt === "OPTIONNELLE"
                                                ? "Optionnelle"
                                                : opt === "OBLIGATOIRE"
                                                  ? "Obligatoire"
                                                  : "Désactivée"}
                                        </label>
                                    ),
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Compte de reflet par défaut
                            </label>
                            <select
                                className={fieldClass}
                                value={form.compteRefletDefaut ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, compteRefletDefaut: e.target.value || undefined })
                                }
                            >
                                <option value="">— Aucun —</option>
                                {COMPTES_REFLET_CLASSE_90.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} — {c.libelle}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-700">Statut</label>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={form.actif}
                                aria-label={form.actif ? "Journal actif" : "Journal inactif"}
                                onClick={() => setForm({ ...form, actif: !form.actif })}
                                className={cn(
                                    "relative w-11 h-6 rounded-full transition-colors shrink-0",
                                    form.actif ? "bg-emerald-500" : "bg-muted",
                                )}
                            >
                                <span
                                    className={cn(
                                        "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow",
                                        form.actif && "translate-x-5",
                                    )}
                                />
                            </button>
                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    form.actif ? "text-emerald-700" : "text-muted-foreground",
                                )}
                            >
                                {form.actif ? "Actif" : "Inactif"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </ComposeFormShell>
    );
}
