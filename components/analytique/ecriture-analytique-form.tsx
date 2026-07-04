"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import {
    NATURES_CHARGE,
    generateNumeroPiece,
    getJournalAnalytiqueById,
    listJournauxAnalytiquesActifs,
    journalAfficheCentreSource,
    journalCentreSourceObligatoire,
    type EcritureAnalytique,
} from "@/lib/analytique/ecriture-analytique";
import {
    mockAxes,
    mockCentres,
    mockComptesAnalytiques,
    mockExercicesCG,
} from "@/lib/analytique/mock-data";
import { countPiecesForYear } from "@/lib/analytique/ecritures-analytiques-store";
import { controlerBudgetEcriture } from "@/lib/analytique/controle-budgetaire";
import { buildLignesImputation, formatMontantSigne } from "@/lib/analytique/ecriture-lignes";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";
import { cn } from "@/lib/utils";

export type EcritureAnalytiqueFormData = Omit<
    EcritureAnalytique,
    "id" | "statut" | "origine" | "createdAt" | "validatedAt" | "rejectReason" | "ligneCGRef" | "lignes"
>;

interface EcritureAnalytiqueFormProps {
    initial?: Partial<EcritureAnalytiqueFormData>;
    onCancel: () => void;
    onSubmit: (data: EcritureAnalytiqueFormData) => void;
}

function centreLabel(centreId: string): string {
    const centre = mockCentres.find((c) => c.id === centreId);
    if (!centre) return centreId;
    const compte = mockComptesAnalytiques.find((c) => c.id === centre.compteAnalytiqueId);
    const numero = compte?.numero ?? centre.code;
    return `${numero} - ${centre.libelle}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            {children}
        </h3>
    );
}

const fieldClass =
    "mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none";

export function EcritureAnalytiqueForm({ initial, onCancel, onSubmit }: EcritureAnalytiqueFormProps) {
    const year = new Date().getFullYear();
    const journauxActifs = listJournauxAnalytiquesActifs();
    const defaultJournal =
        journauxActifs.find((j) => j.exigenceCentreSource === "DESACTIVEE") ?? journauxActifs[0];

    const defaultPiece = useMemo(
        () => generateNumeroPiece(year, countPiecesForYear(year) + 1),
        [year],
    );

    const [form, setForm] = useState<EcritureAnalytiqueFormData>({
        journalId: defaultJournal?.id ?? "",
        dateEffet: new Date().toISOString().slice(0, 10),
        numeroPiece: defaultPiece,
        libelleOperation: "",
        centreDestinationId: mockCentres[0]?.id ?? "",
        axeId: mockCentres[0]?.axeId ?? mockAxes[0]?.id ?? "",
        exerciceAnalytiqueId: mockExercicesCG.find((e) => !e.cloture)?.id ?? mockExercicesCG[0]?.id ?? "",
        natureChargeId: NATURES_CHARGE[0].id,
        montant: 0,
        quantiteUO: undefined,
        centreSourceId: undefined,
        ...initial,
    });

    const journal = getJournalAnalytiqueById(form.journalId);
    const showCentreSource = journal ? journalAfficheCentreSource(journal) : false;
    const centreSourceRequired = journal ? journalCentreSourceObligatoire(journal) : false;

    useEffect(() => {
        const centre = mockCentres.find((c) => c.id === form.centreDestinationId);
        if (centre && centre.axeId !== form.axeId) {
            setForm((f) => ({ ...f, axeId: centre.axeId }));
        }
    }, [form.centreDestinationId, form.axeId]);

    const axeLibelle = mockAxes.find((a) => a.id === form.axeId)?.libelle ?? "—";

    const lignesPreview = useMemo(
        () =>
            form.montant > 0
                ? buildLignesImputation({
                      ...form,
                      libelleOperation: form.libelleOperation || "Opération",
                  })
                : [],
        [form],
    );

    const centreDestination = mockCentres.find((c) => c.id === form.centreDestinationId);
    const exercice = mockExercicesCG.find((e) => e.id === form.exerciceAnalytiqueId);
    const natureCharge = NATURES_CHARGE.find((n) => n.id === form.natureChargeId);
    const uniteOeuvreCentre = centreDestination?.uniteOeuvre ?? "selon le centre";
    const compteDestination = centreDestination?.compteAnalytiqueId
        ? mockComptesAnalytiques.find((c) => c.id === centreDestination.compteAnalytiqueId)
        : undefined;
    const centreBudgetLibelle = centreDestination
        ? compteDestination
            ? `${centreDestination.libelle} (${compteDestination.libelle})`
            : centreDestination.libelle
        : undefined;

    const controleBudget = useMemo(
        () =>
            form.montant > 0
                ? controlerBudgetEcriture({
                      centreDestinationId: form.centreDestinationId,
                      natureChargeId: form.natureChargeId,
                      exerciceAnalytiqueId: form.exerciceAnalytiqueId,
                      montantAjoute: form.montant,
                      centreDestinationLibelle: centreBudgetLibelle,
                      exerciceLibelle: exercice?.libelle,
                      natureChargeLibelle: natureCharge?.libelle,
                  })
                : null,
        [
            form.centreDestinationId,
            form.natureChargeId,
            form.exerciceAnalytiqueId,
            form.montant,
            centreBudgetLibelle,
            exercice?.libelle,
            natureCharge?.libelle,
        ],
    );

    const valid =
        !!form.journalId &&
        !!form.dateEffet &&
        !!form.numeroPiece.trim() &&
        !!form.libelleOperation.trim() &&
        !!form.centreDestinationId &&
        !!form.exerciceAnalytiqueId &&
        !!form.natureChargeId &&
        form.montant > 0 &&
        (!centreSourceRequired || !!form.centreSourceId);

    return (
        <ComposeFormShell
            onCancel={onCancel}
            onSubmit={() => onSubmit(form)}
            submitLabel="Enregistrer en brouillon"
            disabled={!valid}
        >
            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-800">
                        Saisie d&apos;une écriture analytique autonome
                    </p>
                </div>

                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <SectionTitle>Contexte général</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Journal *</label>
                                <select
                                    className={fieldClass}
                                    value={form.journalId}
                                    onChange={(e) => {
                                        const next = getJournalAnalytiqueById(e.target.value);
                                        const keepSource =
                                            next && journalAfficheCentreSource(next)
                                                ? form.centreSourceId
                                                : undefined;
                                        setForm({ ...form, journalId: e.target.value, centreSourceId: keepSource });
                                    }}
                                >
                                    {journauxActifs.map((j) => (
                                        <option key={j.id} value={j.id}>
                                            {j.code} — {j.libelle}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Date d&apos;effet *</label>
                                <input
                                    type="date"
                                    className={fieldClass}
                                    value={form.dateEffet}
                                    onChange={(e) => setForm({ ...form, dateEffet: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">N° Pièce *</label>
                                <input
                                    className={fieldClass}
                                    value={form.numeroPiece}
                                    onChange={(e) => setForm({ ...form, numeroPiece: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Libellé opération *</label>
                                <input
                                    className={fieldClass}
                                    value={form.libelleOperation}
                                    onChange={(e) => setForm({ ...form, libelleOperation: e.target.value })}
                                    placeholder="Ex: Transfert quotes-générales électricité"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SectionTitle>Orientation des flux</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {showCentreSource && (
                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Centre d&apos;analyse source{centreSourceRequired ? " *" : ""}
                                    </label>
                                    <select
                                        className={fieldClass}
                                        value={form.centreSourceId ?? ""}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                centreSourceId: e.target.value || undefined,
                                            })
                                        }
                                    >
                                        <option value="">
                                            {centreSourceRequired
                                                ? "Sélectionner le centre cédant…"
                                                : "— Aucun —"}
                                        </option>
                                        {mockCentres.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {centreLabel(c.id)}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Centre qui cède sa charge ({journal?.libelle}).
                                    </p>
                                </div>
                            )}
                            <div className={cn(!showCentreSource && "md:col-span-2")}>
                                <label className="text-sm font-medium text-slate-700">
                                    Centre destination *
                                </label>
                                <select
                                    className={fieldClass}
                                    value={form.centreDestinationId}
                                    onChange={(e) => setForm({ ...form, centreDestinationId: e.target.value })}
                                >
                                    {mockCentres.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {centreLabel(c.id)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                    Axe analytique <Lock className="h-3 w-3 text-muted-foreground" />
                                </label>
                                <input
                                    className={cn(fieldClass, "bg-slate-100 text-slate-600 cursor-not-allowed")}
                                    value={axeLibelle}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Exercice analytique *</label>
                                <select
                                    className={fieldClass}
                                    value={form.exerciceAnalytiqueId}
                                    onChange={(e) => setForm({ ...form, exerciceAnalytiqueId: e.target.value })}
                                >
                                    {mockExercicesCG.map((ex) => (
                                        <option key={ex.id} value={ex.id}>
                                            {ex.libelle}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SectionTitle>Imputation financière</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Nature de charge *</label>
                                <select
                                    className={fieldClass}
                                    value={form.natureChargeId}
                                    onChange={(e) => setForm({ ...form, natureChargeId: e.target.value })}
                                >
                                    {NATURES_CHARGE.map((n) => (
                                        <option key={n.id} value={n.id}>
                                            {n.code} — {n.libelle}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Montant (XAF) *</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={fieldClass}
                                    value={form.montant || ""}
                                    onChange={(e) =>
                                        setForm({ ...form, montant: parseFloat(e.target.value) || 0 })
                                    }
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Quantité en unité d&apos;œuvre
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    className={fieldClass}
                                    value={form.quantiteUO ?? ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            quantiteUO: e.target.value ? parseFloat(e.target.value) : undefined,
                                        })
                                    }
                                    placeholder={`Ex: nombre de ${uniteOeuvreCentre.toLowerCase()}`}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Unité d&apos;œuvre du centre destination : <strong>{uniteOeuvreCentre}</strong>.
                                    Mesure l&apos;activité associée à cette charge (ex. heures machine, unités produites).
                                    Champ optionnel — le montant en XAF suffit pour l&apos;imputation.
                                </p>
                            </div>
                        </div>
                    </div>

                    {controleBudget?.alerte && (
                        <div
                            className={cn(
                                "flex gap-3 rounded-xl border p-3 text-sm",
                                controleBudget.depassement
                                    ? "border-rose-200 bg-rose-50 text-rose-800"
                                    : "border-amber-200 bg-amber-50 text-amber-800",
                            )}
                        >
                            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">
                                    {controleBudget.depassement
                                        ? "Alerte — dépassement budgétaire"
                                        : "Alerte — seuil budgétaire franchi"}
                                </p>
                                <p className="text-xs mt-1 opacity-90">{controleBudget.message}</p>
                            </div>
                        </div>
                    )}

                    {lignesPreview.length > 0 && (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-3 py-2 border-b text-xs font-semibold text-slate-600">
                                Aperçu des lignes d&apos;imputation
                            </div>
                            <div className="divide-y divide-slate-100">
                                {lignesPreview.map((l, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between px-3 py-2 text-sm"
                                    >
                                        <span className="text-muted-foreground">{centreLabel(l.centreId)}</span>
                                        <span
                                            className={cn(
                                                "font-mono font-semibold",
                                                l.montant < 0 ? "text-rose-600" : "text-emerald-600",
                                            )}
                                        >
                                            {formatMontantSigne(l.montant)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ComposeFormShell>
    );
}
