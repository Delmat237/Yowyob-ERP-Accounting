"use client";

import { useState } from "react";
import {
    ChargeVentilee, VentilationAxe,
    type AxeAnalytique,
    type CentreAnalyse,
    type PeriodeCG,
} from "@/lib/analytique/mock-data";
import { formatCurrency } from "@/lib/utils";
import { useChargesVentilees } from "@/hooks/use-charges-ventilees";
import { useCentresAnalyseApi } from "@/hooks/use-centres-analyse-api";
import { useAxesAnalytiques } from "@/hooks/use-axes-analytiques";
import { usePeriodesAnalytiquesAlignees } from "@/hooks/use-periodes-analytiques-alignees";
import {
    Plus, Pencil, Trash2, AlertCircle, CheckCircle2,
    ArrowRightLeft, X, Info, Lock,
} from "lucide-react";
import { FloatingModal } from "@/components/ui/floating-modal";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

// ─── helpers ──────────────────────────────────────────────────────────────────
const getCentreLabel = (id: string, centres: CentreAnalyse[]) =>
    centres.find((c) => c.id === id)?.libelle ?? "—";
const getAxeLabel = (id: string, axes: AxeAnalytique[]) =>
    axes.find((a) => a.id === id)?.libelle ?? "—";

const COMPTES_CG = [
    { code: "601", libelle: "Achats de matières premières" },
    { code: "602", libelle: "Achats de matières consommables" },
    { code: "606", libelle: "Achats non stockés / énergie" },
    { code: "611", libelle: "Services extérieurs — Sous-traitance" },
    { code: "613", libelle: "Locations" },
    { code: "641", libelle: "Rémunérations du personnel" },
    { code: "645", libelle: "Charges sociales" },
    { code: "681", libelle: "Dotations aux amortissements" },
    { code: "661", libelle: "Charges d'intérêts (NON INCORPORABLE)" },
    { code: "671", libelle: "Charges exceptionnelles (NON INCORPORABLE)" },
];

// ─── VentilationModal ─────────────────────────────────────────────────────────
function VentilationModal({
    initial,
    centres,
    axes,
    periodes,
    onClose,
    onSave,
}: {
    initial?: Partial<ChargeVentilee>;
    centres: CentreAnalyse[];
    axes: AxeAnalytique[];
    periodes: PeriodeCG[];
    onClose: () => void;
    onSave: (d: ChargeVentilee) => void;
}) {
    const defaultPeriode = periodes.find((p) => !p.cloturee) ?? periodes[0];
    const [form, setForm] = useState<Partial<ChargeVentilee>>({
        compteCG: "601",
        libelle: "",
        montantTotal: 0,
        incorporable: true,
        periodeId: defaultPeriode?.id ?? "",
        periodeCGId: defaultPeriode?.id ?? "",
        ventilations: [],
        ...initial,
    });

    const totalPct = (form.ventilations ?? []).reduce((s, v) => s + v.pourcentage, 0);
    const isValid =
        (form.libelle?.trim() ?? "") !== "" &&
        (form.montantTotal ?? 0) > 0 &&
        (!form.incorporable || Math.abs(totalPct - 100) < 0.01);

    const addVentilation = () => {
        setForm((f) => ({
            ...f,
            ventilations: [
                ...(f.ventilations ?? []),
                { axeId: axes[0]?.id ?? "", centreId: centres[0]?.id ?? "", pourcentage: 0 },
            ],
        }));
    };

    const updateVentilation = (idx: number, field: keyof VentilationAxe, value: string | number) => {
        setForm((f) => {
            const vents = [...(f.ventilations ?? [])];
            vents[idx] = { ...vents[idx], [field]: value };
            return { ...f, ventilations: vents };
        });
    };

    const removeVentilation = (idx: number) => {
        setForm((f) => ({
            ...f,
            ventilations: (f.ventilations ?? []).filter((_, i) => i !== idx),
        }));
    };

    const selectedCompte = COMPTES_CG.find((c) => c.code === form.compteCG);
    const isNonIncorporable = selectedCompte?.libelle.includes("NON INCORPORABLE");

    return (
        <FloatingModal
            title={initial?.id ? "Modifier la ventilation" : "Nouvelle charge ventilée"}
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3 px-6 py-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-300 hover:bg-slate-50">Annuler</button>
                    <button
                        disabled={!isValid}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `cv-${Date.now()}`,
                                chargeSourceId: `cg-${form.compteCG}`,
                                compteCG: form.compteCG!,
                                libelle: form.libelle!,
                                montantTotal: form.montantTotal!,
                                incorporable: form.incorporable!,
                                periodeId: form.periodeId!,
                                periodeCGId: form.periodeCGId ?? form.periodeId!,
                                ventilations: form.ventilations ?? [],
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {initial?.id ? "Enregistrer" : "Créer la ventilation"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Compte CG source */}
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                            <ArrowRightLeft className="h-3.5 w-3.5" /> Provenance — Comptabilité Générale
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Compte comptabilité générale *</label>
                                <select
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                    value={form.compteCG ?? "601"}
                                    onChange={(e) => {
                                        const c = COMPTES_CG.find((x) => x.code === e.target.value);
                                        const nonInc = c?.libelle.includes("NON INCORPORABLE") ?? false;
                                        setForm({ ...form, compteCG: e.target.value, incorporable: !nonInc, ventilations: nonInc ? [] : form.ventilations });
                                    }}
                                >
                                    {COMPTES_CG.map((c) => (
                                        <option key={c.code} value={c.code}>{c.code} — {c.libelle}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Période *</label>
                                <select
                                    className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                    value={form.periodeId ?? ""}
                                    onChange={(e) => setForm({ ...form, periodeId: e.target.value, periodeCGId: e.target.value })}
                                >
                                    {periodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Indicateur non incorporable */}
                    {isNonIncorporable && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-rose-700 text-sm">
                            <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Charge non incorporable</p>
                                <p className="text-xs mt-0.5">Ce compte (6x) est classé non incorporable. Il ne sera PAS ventilé en analytique et ne figurera que dans le tableau de concordance comptabilité générale / analytique.</p>
                            </div>
                        </div>
                    )}

                    {/* Détail de la charge */}
                    <div>
                        <label className="text-sm font-medium">Libellé / Référence pièce *</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.libelle ?? ""}
                            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                            placeholder="Ex: Facture FRS-2026-031 — Achats MP"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Montant total (FCFA) *</label>
                            <input
                                type="number" min="0"
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.montantTotal ?? 0}
                                onChange={(e) => setForm({ ...form, montantTotal: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border cursor-pointer select-none transition-colors ${form.incorporable ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                                <input
                                    type="checkbox"
                                    checked={form.incorporable ?? true}
                                    disabled={isNonIncorporable}
                                    onChange={(e) => setForm({ ...form, incorporable: e.target.checked, ventilations: e.target.checked ? form.ventilations : [] })}
                                    className="rounded"
                                />
                                {form.incorporable ? "Incorporable aux coûts" : "Non incorporable"}
                            </label>
                        </div>
                    </div>

                    {/* Ventilations analytiques */}
                    {form.incorporable && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold flex items-center gap-1.5">
                                    <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
                                    Ventilation analytique
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold border ${Math.abs(totalPct - 100) < 0.01 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                        {totalPct.toFixed(1)}% / 100%
                                    </span>
                                </p>
                                <button
                                    onClick={addVentilation}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary"
                                >
                                    <Plus className="h-3 w-3" /> Ajouter une ligne
                                </button>
                            </div>

                            {(form.ventilations ?? []).length === 0 && (
                                <div className="text-center py-6 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                                    Aucune ventilation. Ajoutez au moins une ligne (total doit = 100%).
                                </div>
                            )}

                            {(form.ventilations ?? []).map((v, idx) => {
                                const montantVent = ((form.montantTotal ?? 0) * v.pourcentage) / 100;
                                return (
                                    <div key={idx} className="grid grid-cols-[1fr_1fr_80px_auto] gap-2 items-end bg-indigo-50/40 border border-indigo-100 rounded-xl p-3">
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-semibold uppercase mb-1 block">Axe analytique</label>
                                            <select
                                                className="w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-input"
                                                value={v.axeId}
                                                onChange={(e) => updateVentilation(idx, "axeId", e.target.value)}
                                            >
                                                {axes.filter((a) => a.actif).map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-semibold uppercase mb-1 block">Centre d&apos;analyse</label>
                                            <select
                                                className="w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-input"
                                                value={v.centreId}
                                                onChange={(e) => updateVentilation(idx, "centreId", e.target.value)}
                                            >
                                                {centres.filter((c) => c.actif).map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-semibold uppercase mb-1 block">% de répartition</label>
                                            <input
                                                type="number" min="0" max="100"
                                                className="w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-input text-center"
                                                value={v.pourcentage}
                                                onChange={(e) => updateVentilation(idx, "pourcentage", parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <button onClick={() => removeVentilation(idx)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="text-[10px] text-indigo-600 font-mono">{formatCurrency(montantVent)}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {(form.ventilations ?? []).length > 0 && Math.abs(totalPct - 100) >= 0.01 && (
                                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    Les pourcentages doivent totaliser exactement 100% pour pouvoir enregistrer.
                                </div>
                            )}
                        </div>
                    )}
                </div>
        </FloatingModal>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VentilationPage() {
    const { charges, loading, saveCharge, removeCharge, error: chargesError, usingMockFallback: chargesMock } = useChargesVentilees();
    const { centres, error: centresError, usingMockFallback: centresMock } = useCentresAnalyseApi();
    const { axes, error: axesError, usingMockFallback: axesMock } = useAxesAnalytiques();
    const { periodesCG, error: periodesError } = usePeriodesAnalytiquesAlignees();
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<ChargeVentilee> }>({ open: false });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [filterInc, setFilterInc] = useState<"all" | "incorporable" | "non">("all");

    const apiNotice = chargesError ?? centresError ?? axesError ?? periodesError;
    const usingMockFallback = chargesMock || centresMock || axesMock;

    const filtered = charges.filter((c) => {
        if (filterInc === "incorporable") return c.incorporable;
        if (filterInc === "non") return !c.incorporable;
        return true;
    });

    const totalIncorporable = charges.filter((c) => c.incorporable).reduce((s, c) => s + c.montantTotal, 0);
    const totalNonIncorporable = charges.filter((c) => !c.incorporable).reduce((s, c) => s + c.montantTotal, 0);
    const totalVentile = charges.filter((c) => c.incorporable && c.ventilations.length > 0).reduce((s, c) => s + c.montantTotal, 0);
    const totalNonVentile = charges.filter((c) => c.incorporable && c.ventilations.length === 0).reduce((s, c) => s + c.montantTotal, 0);

    const handleSave = async (data: ChargeVentilee) => {
        await saveCharge(data);
    };

    if (loading && charges.length === 0) {
        return <CustomPageLoader message="Chargement des ventilations..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {(apiNotice || usingMockFallback) && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{apiNotice ?? "Certaines données proviennent du mode démonstration."}</span>
                </div>
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                {usingMockFallback
                    ? "Les charges ventilées sont persistées localement en attendant l'endpoint backend."
                    : "Les charges ventilées sont synchronisées avec le serveur."}
            </div>
            {modal.open && (
                <VentilationModal
                    initial={modal.initial}
                    centres={centres}
                    axes={axes}
                    periodes={periodesCG}
                    onClose={() => setModal({ open: false })}
                    onSave={handleSave}
                />
            )}
            {deleteId && (
                <ConfirmDialog
                    title="Supprimer cette ventilation ?"
                    onClose={() => setDeleteId(null)}
                    onConfirm={async () => {
                        await removeCharge(deleteId);
                        setDeleteId(null);
                    }}
                >
                    <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
                </ConfirmDialog>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Ventilation Analytique</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Import sélectif des charges de la comptabilité générale et ventilation multi-axes — seules les charges incorporables transitent en comptabilité analytique
                    </p>
                </div>
                <button
                    onClick={() => setModal({ open: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm"
                >
                    <Plus className="h-4 w-4" /> Nouvelle ventilation
                </button>
            </div>

            {/* Séparation CG/CA — banner pédagogique */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3">
                <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-800">
                    <p className="font-bold mb-1">Principe de séparation comptabilité générale / analytique</p>
                    <p>Les charges proviennent de la <strong>Comptabilité Générale</strong> (comptes 6xx). Seules celles marquées <strong>incorporables</strong> sont ventilées sur les axes et centres analytiques. Les charges <strong>non incorporables</strong> (intérêts 661, exceptionnel 671…) restent uniquement dans la comptabilité générale et apparaissent dans le tableau de concordance.</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total incorporable", value: formatCurrency(totalIncorporable), color: "bg-emerald-100 text-emerald-600", icon: CheckCircle2 },
                    { label: "Non incorporable", value: formatCurrency(totalNonIncorporable), color: "bg-rose-100 text-rose-600", icon: Lock },
                    { label: "Ventilé", value: formatCurrency(totalVentile), color: "bg-indigo-100 text-indigo-600", icon: ArrowRightLeft },
                    { label: "En attente ventilation", value: formatCurrency(totalNonVentile), color: "bg-amber-100 text-amber-600", icon: AlertCircle },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                        <div className={`p-2 rounded-lg w-fit ${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
                        <p className="text-lg font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex border border-border rounded-xl overflow-hidden">
                    {([
                        { key: "all", label: "Toutes" },
                        { key: "incorporable", label: "Incorporables" },
                        { key: "non", label: "Non incorporables" },
                    ] as const).map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilterInc(f.key)}
                            className={`px-3 py-2 text-sm transition-colors ${filterInc === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="space-y-3">
                {filtered.map((charge) => {
                    const totalPct = charge.ventilations.reduce((s, v) => s + v.pourcentage, 0);
                    const ventilationOk = !charge.incorporable || Math.abs(totalPct - 100) < 0.01;

                    return (
                        <div key={charge.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${!charge.incorporable ? "border-rose-200 opacity-75" : ventilationOk ? "border-border" : "border-amber-300"}`}>
                            {/* Charge header */}
                            <div className="flex items-start justify-between p-4 border-b border-border/50">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl flex-shrink-0 ${charge.incorporable ? "bg-indigo-100 text-indigo-600" : "bg-rose-100 text-rose-600"}`}>
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-mono">{charge.compteCG}</span>
                                            <p className="text-sm font-semibold text-foreground">{charge.libelle}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{periodesCG.find((p) => p.id === charge.periodeId)?.libelle ?? "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-base font-bold font-mono text-foreground">{formatCurrency(charge.montantTotal)}</p>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${charge.incorporable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                            {charge.incorporable ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                                            {charge.incorporable ? "Incorporable" : "Non incorporable"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setModal({ open: true, initial: charge })}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(charge.id)}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Ventilations */}
                            {charge.incorporable && (
                                <div className="p-4">
                                    {charge.ventilations.length === 0 ? (
                                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs">
                                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                            Charge incorporable sans ventilation analytique — à compléter.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold text-muted-foreground uppercase">Ventilation analytique</p>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ventilationOk ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                                    {totalPct.toFixed(1)}%
                                                    {ventilationOk ? " ✓" : " — doit = 100%"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                {charge.ventilations.map((v, idx) => {
                                                    const montant = (charge.montantTotal * v.pourcentage) / 100;
                                                    return (
                                                        <div key={idx} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs font-semibold text-indigo-800">{getCentreLabel(v.centreId, centres)}</p>
                                                                <p className="text-[10px] text-indigo-600">{getAxeLabel(v.axeId, axes)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-indigo-700">{v.pourcentage}%</p>
                                                                <p className="text-[10px] text-muted-foreground font-mono">{formatCurrency(montant)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!charge.incorporable && (
                                <div className="px-4 py-3 bg-rose-50/40">
                                    <p className="text-xs text-rose-600 flex items-center gap-1.5">
                                        <Lock className="h-3.5 w-3.5" />
                                        Cette charge ne transite pas en comptabilité analytique. Elle apparaît uniquement dans le tableau de concordance comptabilité générale / analytique.
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
