"use client";

import { useState } from "react";
import {
    mockPeriodes, mockPeriodesCG, mockChargesVentilees,
    mockLignesConcordance, mockCoutsProduits,
    LigneConcordance, TypeDifference,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
    Scale, CheckCircle2, AlertTriangle, ArrowRightLeft,
    Plus, Pencil, Trash2, X, Info, ChevronDown,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<TypeDifference, string> = {
    CHARGE_NON_INC: "Charge non incorporable",
    PRODUIT_NON_INC: "Produit non incorporable",
    CHARGE_SUPPLETIVE: "Charge supplétive",
    PRODUIT_SUPPLETIF: "Produit supplétif",
    DIFF_AMORT: "Différence sur amortissements",
    DIFF_IMPUTATION: "Différence d'imputation rationnelle",
    DIFF_INVENTAIRE: "Différence d'inventaire",
};

const SIGNE_COLOR = {
    "+": "bg-emerald-100 text-emerald-700",
    "-": "bg-rose-100 text-rose-700",
};

// ─── Modal ligne concordance ──────────────────────────────────────────────────
function LigneConcModal({
    initial, onClose, onSave,
}: { initial?: Partial<LigneConcordance>; onClose: () => void; onSave: (d: LigneConcordance) => void }) {
    const [form, setForm] = useState<Partial<LigneConcordance>>({
        type: "CHARGE_NON_INC",
        label: "",
        description: "",
        signe: "+",
        montant: 0,
        ...initial,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">{initial?.id ? "Modifier la ligne" : "Nouvelle ligne de concordance"}</h2>
                    <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Type *</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.type ?? "CHARGE_NON_INC"}
                                onChange={(e) => setForm({ ...form, type: e.target.value as TypeDifference })}
                            >
                                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Opération *</label>
                            <div className="mt-1 flex border border-border rounded-xl overflow-hidden">
                                {(["+", "-"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setForm({ ...form, signe: s })}
                                        className={`flex-1 py-2 text-sm font-bold transition-colors ${form.signe === s ? (s === "+" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white") : "text-muted-foreground hover:bg-secondary"}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Libellé *</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.label ?? ""}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                            placeholder="Ex: Charges d'intérêts"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.description ?? ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Détail du retraitement"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Montant (FCFA) *</label>
                        <input
                            type="number" min="0"
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.montant ?? 0}
                            onChange={(e) => setForm({ ...form, montant: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button
                        disabled={!form.label?.trim() || !form.montant}
                        onClick={() => {
                            onSave({ id: form.id ?? `lc-${Date.now()}`, type: form.type!, label: form.label!, description: form.description ?? "", signe: form.signe!, montant: form.montant! });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
                    >
                        {initial?.id ? "Enregistrer" : "Ajouter"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConcordancePage() {
    // Sélecteur de période analytique
    const periodesAvecCG = mockPeriodes.filter((p) => p.periodeCGId !== "");
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(periodesAvecCG[2]?.id ?? periodesAvecCG[0]?.id);
    const [lignes, setLignes] = useState<LigneConcordance[]>(mockLignesConcordance);
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<LigneConcordance> }>({ open: false });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const periodeCA = mockPeriodes.find((p) => p.id === selectedPeriodeId);
    const periodeCG = mockPeriodesCG.find((p) => p.id === periodeCA?.periodeCGId);

    // ── Calculs dynamiques ────────────────────────────────────────────────────

    // Résultat net CG pour la période sélectionnée (vient du module CG)
    const resultCG = periodeCG?.resultatNet ?? 0;

    // Charges non incorporables calculées depuis mockChargesVentilees
    const chargesNonIncCette = mockChargesVentilees.filter(
        (c) => !c.incorporable && c.periodeId === selectedPeriodeId
    );
    const totalNonInc = chargesNonIncCette.reduce((s, c) => s + c.montantTotal, 0);

    // Total incorporable ventilé
    const totalIncorporable = mockChargesVentilees
        .filter((c) => c.incorporable && c.periodeId === selectedPeriodeId)
        .reduce((s, c) => s + c.montantTotal, 0);

    // Résultat analytique produits (sum coûts de revient vs CA — simplifié)
    const resultatAnalytiqueProduits = mockCoutsProduits
        .filter((cp) => cp.periodeId === selectedPeriodeId)
        .reduce((s, cp) => s + (cp.coutRevient * 0.1), 0); // simulé : marge 10%

    // Calcul du résultat CA reconstitué depuis les lignes de concordance
    const sommeDiff = lignes.reduce(
        (s, l) => l.signe === "+" ? s + l.montant : s - l.montant,
        0
    );
    const resultCA = resultCG + sommeDiff;

    // Écart de vérification entre résultat CA reconstitué et résultat produits
    const ecartVerif = resultCA - resultatAnalytiqueProduits;
    const concordanceOk = Math.abs(ecartVerif) < 1000; // tolérance d'arrondi

    const handleSaveLigne = (data: LigneConcordance) => {
        setLignes((p) => p.find((l) => l.id === data.id) ? p.map((l) => l.id === data.id ? data : l) : [...p, data]);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {modal.open && (
                <LigneConcModal
                    initial={modal.initial}
                    onClose={() => setModal({ open: false })}
                    onSave={handleSaveLigne}
                />
            )}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6">
                        <h3 className="text-base font-bold mb-2">Supprimer cette ligne ?</h3>
                        <p className="text-sm text-muted-foreground mb-4">Cette action est irréversible.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                            <button onClick={() => { setLignes((p) => p.filter((l) => l.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 text-sm rounded-xl bg-destructive text-destructive-foreground font-medium">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Concordance CG / CA</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Rapprochement des résultats CG et CA via les différences d&apos;incorporation
                    </p>
                </div>
                {/* Sélecteur de période */}
                <div className="relative">
                    <select
                        className="appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-xl bg-card font-medium focus:ring-2 focus:ring-ring"
                        value={selectedPeriodeId}
                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                    >
                        {periodesAvecCG.map((p) => (
                            <option key={p.id} value={p.id}>{p.libelle}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Lien CG période */}
            {periodeCG && (
                <div className="bg-muted/30 border border-border rounded-xl p-3 flex items-center gap-3 text-sm">
                    <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                        Période CG liée :
                        <strong className="text-foreground ml-1">{periodeCG.code} — {periodeCG.libelle}</strong>
                    </span>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${periodeCG.cloturee ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {periodeCG.cloturee ? "Clôturée" : "Ouverte"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        CG : Charges {formatCurrency(periodeCG.totalChargesCG)} · Produits {formatCurrency(periodeCG.totalProduitsCG)}
                    </span>
                </div>
            )}

            {/* 3 colonnes : CG → pont → CA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-100 rounded-bl-full opacity-40" />
                    <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1 relative z-10">
                        Résultat — Comptabilité Générale
                    </p>
                    <p className="text-3xl font-bold text-cyan-700 relative z-10">{formatCurrency(resultCG)}</p>
                    <p className="text-xs text-cyan-600 mt-3 relative z-10 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {periodeCG ? `Source : période ${periodeCG.code}` : "Source : Yowyob-ERP-Accounting"}
                    </p>
                    {/* Détail CG */}
                    <div className="mt-3 pt-3 border-t border-cyan-200 space-y-1 relative z-10">
                        <div className="flex justify-between text-xs text-cyan-700">
                            <span>Charges CG</span>
                            <span className="font-mono">{formatCurrency(periodeCG?.totalChargesCG ?? 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-cyan-700">
                            <span>Dont non incorporables</span>
                            <span className="font-mono text-rose-600">{formatCurrency(totalNonInc)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-cyan-700">
                            <span>Dont incorporables ventilés</span>
                            <span className="font-mono text-emerald-600">{formatCurrency(totalIncorporable)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-muted/20 border border-dashed border-border rounded-2xl">
                    <Scale className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm font-bold text-center">Retraitements</p>
                    <p className="text-xs text-muted-foreground text-center mt-1">± {lignes.length} différences d&apos;incorporation</p>
                    <p className={`mt-2 text-sm font-bold ${sommeDiff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {sommeDiff >= 0 ? "+" : ""}{formatCurrency(sommeDiff)}
                    </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-bl-full opacity-40" />
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1 relative z-10">
                        Résultat — Comptabilité Analytique
                    </p>
                    <p className="text-3xl font-bold text-indigo-700 relative z-10">{formatCurrency(resultCA)}</p>
                    <p className="text-xs text-indigo-600 mt-3 relative z-10 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reconstitué par retraitement
                    </p>
                    {/* Vérification */}
                    <div className={`mt-3 pt-3 border-t relative z-10 ${concordanceOk ? "border-emerald-200" : "border-amber-300"}`}>
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 rounded-lg ${concordanceOk ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {concordanceOk
                                ? <><CheckCircle2 className="h-3.5 w-3.5" /> Concordance vérifiée</>
                                : <><AlertTriangle className="h-3.5 w-3.5" /> Écart : {formatCurrency(Math.abs(ecartVerif))}</>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau de détail */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-bold">Détail des différences d&apos;incorporation</h3>
                    </div>
                    <button
                        onClick={() => setModal({ open: true })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90"
                    >
                        <Plus className="h-3.5 w-3.5" /> Ajouter
                    </button>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr className="text-xs text-muted-foreground uppercase">
                            <th className="text-left px-5 py-3">Élément de conciliation</th>
                            <th className="text-left px-5 py-3 hidden md:table-cell">Description</th>
                            <th className="text-left px-5 py-3">Type</th>
                            <th className="text-center px-5 py-3">Op.</th>
                            <th className="text-right px-5 py-3">Montant</th>
                            <th className="px-3 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Ligne de base : résultat CG */}
                        <tr className="bg-cyan-50/40 border-b-2 border-border">
                            <td className="px-5 py-3 font-bold text-cyan-800" colSpan={4}>
                                Résultat Net (Comptabilité Générale) — {periodeCA?.libelle}
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-cyan-700">
                                {formatCurrency(resultCG)}
                            </td>
                            <td />
                        </tr>

                        {lignes.map((l) => (
                            <tr key={l.id} className="border-b border-border/30 hover:bg-secondary/20">
                                <td className="px-5 py-3 font-medium">{l.label}</td>
                                <td className="px-5 py-3 text-muted-foreground text-xs hidden md:table-cell">{l.description}</td>
                                <td className="px-5 py-3">
                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-semibold text-muted-foreground">
                                        {TYPE_LABELS[l.type]}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-sm ${SIGNE_COLOR[l.signe]}`}>
                                        {l.signe}
                                    </span>
                                </td>
                                <td className={`px-5 py-3 text-right font-mono font-medium ${l.signe === "+" ? "text-emerald-600" : "text-rose-600"}`}>
                                    {formatCurrency(l.montant)}
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setModal({ open: true, initial: l })} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => setDeleteId(l.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Ligne de résultat CA reconstitué */}
                        <tr className="bg-indigo-50/40 border-t-2 border-indigo-200">
                            <td className="px-5 py-4 font-bold text-indigo-900" colSpan={4}>
                                Résultat Analytique Reconstitué
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-indigo-700 text-lg">
                                {formatCurrency(resultCA)}
                            </td>
                            <td />
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Alerte de validation */}
            {concordanceOk ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-sm">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <p>
                        La concordance est validée. Le résultat analytique reconstitué ({formatCurrency(resultCA)}) correspond
                        au résultat CG ({formatCurrency(resultCG)}) après retraitements.
                    </p>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p>
                        Écart résiduel de <strong>{formatCurrency(Math.abs(ecartVerif))}</strong>.
                        Le résultat analytique reconstitué doit correspondre exactement à la somme des résultats par produit
                        calculée dans le module <strong>Coûts Complets</strong>. Vérifiez les lignes de concordance et les imputations.
                    </p>
                </div>
            )}
        </div>
    );
}
