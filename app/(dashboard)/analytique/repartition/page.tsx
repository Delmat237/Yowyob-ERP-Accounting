"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
    RefreshCw, CheckCircle2, AlertCircle, Plus, Pencil, Trash2, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { useClesRepartitionApi } from "@/hooks/use-cles-repartition-api";
import { useCentresAnalyseApi } from "@/hooks/use-centres-analyse-api";
import {
    TYPE_CLE_LABELS,
    type CleRepartitionUi,
    type TypeCleRepartition,
} from "@/lib/analytique/cle-repartition";
import { FloatingModal } from "@/components/ui/floating-modal";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

// Répartition matrix: simulation locale (UC-03)
const NATURES = ["Électricité", "Amortissements", "Frais généraux", "Entretien/Réparations"];
const PRINCIPAL_CENTRES = ["Production", "Distribution", "Administration"];
const AUX_CENTRES = ["Entretien", "Logistique"];

type Matrix = Record<string, Record<string, number>>;

const initPrimaire: Matrix = {
    "Électricité": { "Production": 60, "Distribution": 20, "Administration": 10, "Entretien": 5, "Logistique": 5 },
    "Amortissements": { "Production": 70, "Distribution": 10, "Administration": 15, "Entretien": 5, "Logistique": 0 },
    "Frais généraux": { "Production": 40, "Distribution": 25, "Administration": 30, "Entretien": 5, "Logistique": 0 },
    "Entretien/Réparations": { "Production": 50, "Distribution": 20, "Administration": 20, "Entretien": 10, "Logistique": 0 },
};

const initSecondaire: Matrix = {
    "Entretien": { "Production": 60, "Distribution": 30, "Administration": 10 },
    "Logistique": { "Production": 50, "Distribution": 40, "Administration": 10 },
};

const TOTAUX: Record<string, number> = {
    "Électricité": 450000,
    "Amortissements": 320000,
    "Frais généraux": 280000,
    "Entretien/Réparations": 150000,
};

function rowTotal(row: Record<string, number>): number {
    return Object.values(row).reduce((a, b) => a + b, 0);
}

function CleRepartitionModal({
    initial,
    centreOptions,
    onClose,
    onSave,
}: {
    initial?: Partial<CleRepartitionUi>;
    centreOptions: { id: string; libelle: string }[];
    onClose: () => void;
    onSave: (data: CleRepartitionUi) => Promise<void>;
}) {
    const [form, setForm] = useState<Partial<CleRepartitionUi>>({
        code: "",
        libelle: "",
        type: "FIXE",
        actif: true,
        lignes: [],
        ...initial,
    });
    const [saving, setSaving] = useState(false);

    const totalPct = (form.lignes ?? []).reduce((s, l) => s + l.pourcentage, 0);
    const isValid =
        (form.code?.trim() ?? "") !== "" &&
        (form.libelle?.trim() ?? "") !== "" &&
        (form.type !== "FIXE" || (form.lignes ?? []).length === 0 || Math.abs(totalPct - 100) < 0.01);

    const addLigne = () => {
        setForm((f) => ({
            ...f,
            lignes: [
                ...(f.lignes ?? []),
                { centreId: centreOptions[0]?.id ?? "", pourcentage: 0 },
            ],
        }));
    };

    return (
        <FloatingModal
            title={initial?.id ? "Modifier la clé" : "Nouvelle clé de répartition"}
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3 px-6 py-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-300 hover:bg-slate-50">
                        Annuler
                    </button>
                    <button
                        disabled={!isValid || saving}
                        onClick={async () => {
                            setSaving(true);
                            try {
                                await onSave({
                                    id: form.id ?? `cle-${Date.now()}`,
                                    code: form.code!.trim(),
                                    libelle: form.libelle!.trim(),
                                    type: form.type as TypeCleRepartition,
                                    actif: form.actif ?? true,
                                    lignes: form.lignes ?? [],
                                });
                                onClose();
                            } catch {
                                toast.error("Impossible d'enregistrer la clé");
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                        Enregistrer
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium">Code *</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.code ?? ""}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Type *</label>
                        <select
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.type ?? "FIXE"}
                            onChange={(e) => setForm({ ...form, type: e.target.value as TypeCleRepartition })}
                        >
                            {(Object.keys(TYPE_CLE_LABELS) as TypeCleRepartition[]).map((t) => (
                                <option key={t} value={t}>{TYPE_CLE_LABELS[t]}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium">Libellé *</label>
                    <input
                        className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                        value={form.libelle ?? ""}
                        onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                    />
                </div>
                {form.type === "FIXE" && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">Lignes de répartition</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Math.abs(totalPct - 100) < 0.01 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                {totalPct.toFixed(1)}%
                            </span>
                            <button type="button" onClick={addLigne} className="text-xs px-2 py-1 border rounded-lg hover:bg-secondary">
                                <Plus className="h-3 w-3 inline" /> Ligne
                            </button>
                        </div>
                        {(form.lignes ?? []).map((l, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_80px_auto] gap-2 items-center">
                                <select
                                    className="text-sm border border-border rounded-lg px-2 py-1.5 bg-input"
                                    value={l.centreId}
                                    onChange={(e) => {
                                        const lignes = [...(form.lignes ?? [])];
                                        lignes[idx] = { ...lignes[idx], centreId: e.target.value };
                                        setForm({ ...form, lignes });
                                    }}
                                >
                                    {centreOptions.map((c) => (
                                        <option key={c.id} value={c.id}>{c.libelle}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="text-sm border border-border rounded-lg px-2 py-1.5 bg-input text-center"
                                    value={l.pourcentage}
                                    onChange={(e) => {
                                        const lignes = [...(form.lignes ?? [])];
                                        lignes[idx] = { ...lignes[idx], pourcentage: parseFloat(e.target.value) || 0 };
                                        setForm({ ...form, lignes });
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, lignes: (form.lignes ?? []).filter((_, i) => i !== idx) })}
                                    className="p-1 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FloatingModal>
    );
}

export default function RepartitionPage() {
    const { cles, loading, error, usingMockFallback, saveCle, deleteCle } = useClesRepartitionApi();
    const { centres } = useCentresAnalyseApi();
    const centreOptions = centres.map((c) => ({ id: c.id, libelle: c.libelle }));

    const [primaire, setPrimaire] = useState<Matrix>(initPrimaire);
    const [secondaire, setSecondaire] = useState<Matrix>(initSecondaire);
    const [step, setStep] = useState<"cles" | "primaire" | "secondaire">("cles");
    const [cleModal, setCleModal] = useState<{ open: boolean; initial?: Partial<CleRepartitionUi> }>({ open: false });
    const [deleteCleId, setDeleteCleId] = useState<string | null>(null);

    const allCentres = [...PRINCIPAL_CENTRES, ...AUX_CENTRES];

    const updateCell = (
        matrix: Matrix,
        setMatrix: React.Dispatch<React.SetStateAction<Matrix>>,
        row: string,
        col: string,
        val: number,
    ) => {
        setMatrix({ ...matrix, [row]: { ...matrix[row], [col]: val } });
    };

    const isRowValid = (row: Record<string, number>) => Math.abs(rowTotal(row) - 100) < 0.01;

    const primaryTotals: Record<string, number> = {};
    [...PRINCIPAL_CENTRES, ...AUX_CENTRES].forEach((c) => {
        primaryTotals[c] = NATURES.reduce((sum, n) => {
            const pct = primaire[n]?.[c] ?? 0;
            return sum + (TOTAUX[n] * pct) / 100;
        }, 0);
    });

    const secondaryTransfer: Record<string, number> = {};
    PRINCIPAL_CENTRES.forEach((p) => {
        secondaryTransfer[p] = AUX_CENTRES.reduce((sum, a) => {
            const pct = secondaire[a]?.[p] ?? 0;
            return sum + (primaryTotals[a] * pct) / 100;
        }, 0);
    });

    const finalTotals: Record<string, number> = {};
    PRINCIPAL_CENTRES.forEach((p) => {
        finalTotals[p] = primaryTotals[p] + secondaryTransfer[p];
    });

    const getCentreLabel = (id: string) => centres.find((c) => c.id === id)?.libelle ?? id;

    if (loading && cles.length === 0) {
        return <CustomPageLoader message="Chargement des clés de répartition..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {error && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {cleModal.open && (
                <CleRepartitionModal
                    initial={cleModal.initial}
                    centreOptions={centreOptions}
                    onClose={() => setCleModal({ open: false })}
                    onSave={saveCle}
                />
            )}
            {deleteCleId && (
                <ConfirmDialog
                    title="Supprimer cette clé ?"
                    onClose={() => setDeleteCleId(null)}
                    onConfirm={async () => {
                        await deleteCle(deleteCleId);
                        setDeleteCleId(null);
                    }}
                >
                    <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
                </ConfirmDialog>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Répartition</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Clés de répartition (API) et simulation primaire/secondaire des charges indirectes
                    </p>
                </div>
                <button
                    onClick={() => { setPrimaire(initPrimaire); setSecondaire(initSecondaire); }}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary"
                >
                    <RefreshCw className="h-4 w-4" /> Réinitialiser simulation
                </button>
            </div>

            <div className="flex gap-3 flex-wrap">
                {([
                    { key: "cles", label: "Clés de répartition" },
                    { key: "primaire", label: "① Simulation primaire" },
                    { key: "secondaire", label: "② Simulation secondaire" },
                ] as const).map((s) => (
                    <button
                        key={s.key}
                        onClick={() => setStep(s.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${step === s.key
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-border text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {step === "cles" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {usingMockFallback
                                ? "Clés en mode démonstration — connectez l'API pour persister."
                                : `${cles.length} clé(s) chargée(s) depuis l'API.`}
                        </p>
                        <button
                            onClick={() => setCleModal({ open: true })}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" /> Nouvelle clé
                        </button>
                    </div>
                    {cles.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                            Aucune clé de répartition. Créez-en une pour ventiler les charges indirectes.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cles.map((cle) => {
                                const totalPct = cle.lignes.reduce((s, l) => s + l.pourcentage, 0);
                                const ok = cle.type !== "FIXE" || cle.lignes.length === 0 || Math.abs(totalPct - 100) < 0.01;
                                return (
                                    <div key={cle.id} className={`bg-card rounded-2xl border shadow-sm p-4 ${ok ? "border-border" : "border-amber-300"}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                                                    <KeyRound className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{cle.code}</span>
                                                        <p className="font-semibold">{cle.libelle}</p>
                                                        <span className="text-[10px] text-muted-foreground">{TYPE_CLE_LABELS[cle.type]}</span>
                                                    </div>
                                                    {cle.type === "FIXE" && cle.lignes.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {cle.lignes.map((l, i) => (
                                                                <span key={i} className="text-xs bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">
                                                                    {getCentreLabel(l.centreId)} : {l.pourcentage}%
                                                                </span>
                                                            ))}
                                                            <span className={`text-xs font-bold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
                                                                Σ {totalPct.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setCleModal({ open: true, initial: cle })} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteCleId(cle.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {step === "primaire" && (
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        Simulation locale — les pourcentages de chaque ligne doivent totaliser 100%.
                    </div>
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Nature de charge</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Montant total</th>
                                    {allCentres.map((c) => (
                                        <th key={c} className={`text-center px-3 py-3 text-xs font-semibold uppercase ${AUX_CENTRES.includes(c) ? "text-cyan-600" : "text-indigo-600"}`}>
                                            {c}
                                        </th>
                                    ))}
                                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase">Total %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {NATURES.map((n) => {
                                    const total = rowTotal(primaire[n] ?? {});
                                    const valid = isRowValid(primaire[n] ?? {});
                                    return (
                                        <tr key={n} className="border-b border-border/50 hover:bg-secondary/20">
                                            <td className="px-4 py-2.5 font-medium text-foreground">{n}</td>
                                            <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">{formatCurrency(TOTAUX[n])}</td>
                                            {allCentres.map((c) => (
                                                <td key={c} className="px-2 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        className={`w-16 text-center text-sm border rounded-lg px-2 py-1 bg-input ${AUX_CENTRES.includes(c) ? "border-cyan-200" : "border-indigo-200"}`}
                                                        value={primaire[n]?.[c] ?? 0}
                                                        onChange={(e) => updateCell(primaire, setPrimaire, n, c, parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${valid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                                    {total.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-muted/30 border-t border-border">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-foreground">Total centres</td>
                                    <td className="px-4 py-3 text-right font-bold text-foreground font-mono text-xs">{formatCurrency(Object.values(TOTAUX).reduce((a, b) => a + b, 0))}</td>
                                    {allCentres.map((c) => (
                                        <td key={c} className="px-3 py-3 text-center font-bold text-foreground font-mono text-xs">
                                            {formatCurrency(primaryTotals[c])}
                                        </td>
                                    ))}
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {step === "secondaire" && (
                <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        Simulation locale — redistribution des centres auxiliaires vers les centres principaux.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {AUX_CENTRES.map((a) => (
                            <div key={a} className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                                <p className="text-sm font-bold text-cyan-800">{a}</p>
                                <p className="text-lg font-bold text-cyan-700 mt-1">{formatCurrency(primaryTotals[a])}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Centre auxiliaire</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Total à répartir</th>
                                    {PRINCIPAL_CENTRES.map((c) => (
                                        <th key={c} className="text-center px-3 py-3 text-xs font-semibold text-indigo-600 uppercase">{c}</th>
                                    ))}
                                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase">Total %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {AUX_CENTRES.map((a) => {
                                    const total = rowTotal(secondaire[a] ?? {});
                                    const valid = Math.abs(total - 100) < 0.01;
                                    return (
                                        <tr key={a} className="border-b border-border/50 hover:bg-secondary/20">
                                            <td className="px-4 py-2.5 font-medium text-cyan-700">{a}</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatCurrency(primaryTotals[a])}</td>
                                            {PRINCIPAL_CENTRES.map((c) => (
                                                <td key={c} className="px-2 py-2 text-center">
                                                    <input
                                                        type="number" min="0" max="100"
                                                        className="w-16 text-center text-sm border border-indigo-200 rounded-lg px-2 py-1 bg-input"
                                                        value={secondaire[a]?.[c] ?? 0}
                                                        onChange={(e) => updateCell(secondaire, setSecondaire, a, c, parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${valid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                                    {total.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-indigo-50/50 border-t border-indigo-200">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 font-bold text-indigo-800">Total final par centre principal</td>
                                    {PRINCIPAL_CENTRES.map((c) => (
                                        <td key={c} className="px-3 py-3 text-center font-bold text-indigo-700 text-sm">
                                            {formatCurrency(finalTotals[c])}
                                        </td>
                                    ))}
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
