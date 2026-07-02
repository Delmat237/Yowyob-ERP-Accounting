"use client";

import { useState } from "react";
import {
    mockBudgets, mockCentres, mockPeriodes, mockAxes,
    BudgetAnalytique, LigneBudget, StatutBudget,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
    Plus, Pencil, Trash2, RefreshCw, Search, TrendingUp,
    TrendingDown, CheckCircle2, AlertCircle, Clock, X, Save,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── helpers ──────────────────────────────────────────────────────────────────
const getCentreLabel = (id: string) => mockCentres.find((c) => c.id === id)?.libelle ?? "—";
const getAxeLabel = (id: string) => mockAxes.find((a) => a.id === id)?.libelle ?? "—";
const getPeriodeLabel = (id: string) => mockPeriodes.find((p) => p.id === id)?.libelle ?? "—";

const statutConfig: Record<StatutBudget, { label: string; color: string; icon: React.ElementType }> = {
    BROUILLON: { label: "Brouillon", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
    VALIDE: { label: "Validé", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    REVISE: { label: "Révisé", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
};

// ─── LigneBudgetModal ─────────────────────────────────────────────────────────
function LigneModal({
    initial, onClose, onSave,
}: { initial?: Partial<LigneBudget>; onClose: () => void; onSave: (d: LigneBudget) => void }) {
    const [form, setForm] = useState<Partial<LigneBudget>>({
        centreId: mockCentres[0].id,
        axeId: mockAxes[0].id,
        nature: "",
        montantBudget: 0,
        montantReel: 0,
        periodeId: mockPeriodes[0].id,
        ...initial,
    });

    const valid = (form.nature?.trim() ?? "") !== "" && (form.montantBudget ?? 0) > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">{initial?.id ? "Modifier la ligne" : "Nouvelle ligne budgétaire"}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium">Nature de charge *</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.nature ?? ""}
                            onChange={(e) => setForm({ ...form, nature: e.target.value })}
                            placeholder="Ex: Matières premières"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Centre *</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.centreId ?? ""}
                                onChange={(e) => setForm({ ...form, centreId: e.target.value })}
                            >
                                {mockCentres.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Axe *</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.axeId ?? ""}
                                onChange={(e) => setForm({ ...form, axeId: e.target.value })}
                            >
                                {mockAxes.filter((a) => a.actif).map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Montant budgété (FCFA) *</label>
                            <input
                                type="number" min="0"
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.montantBudget ?? 0}
                                onChange={(e) => setForm({ ...form, montantBudget: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Réalisé (FCFA)</label>
                            <input
                                type="number" min="0"
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.montantReel ?? 0}
                                onChange={(e) => setForm({ ...form, montantReel: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button
                        disabled={!valid}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `bl-${Date.now()}`,
                                centreId: form.centreId!,
                                axeId: form.axeId!,
                                nature: form.nature!,
                                montantBudget: form.montantBudget!,
                                montantReel: form.montantReel ?? 0,
                                periodeId: form.periodeId ?? "p3",
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {initial?.id ? "Enregistrer" : "Ajouter"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── BudgetFormModal ──────────────────────────────────────────────────────────
function BudgetFormModal({
    initial, onClose, onSave,
}: { initial?: Partial<BudgetAnalytique>; onClose: () => void; onSave: (d: BudgetAnalytique) => void }) {
    const [form, setForm] = useState<Partial<BudgetAnalytique>>({
        libelle: "",
        exercice: "2026",
        periodeId: mockPeriodes[2].id,
        statut: "BROUILLON",
        lignes: [],
        ...initial,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">{initial?.id ? "Modifier le budget" : "Nouveau budget"}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium">Libellé *</label>
                        <input
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.libelle ?? ""}
                            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                            placeholder="Ex: Budget Prévisionnel 2026"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Exercice *</label>
                            <input
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.exercice ?? ""}
                                onChange={(e) => setForm({ ...form, exercice: e.target.value })}
                                placeholder="2026"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Période *</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                                value={form.periodeId ?? ""}
                                onChange={(e) => setForm({ ...form, periodeId: e.target.value })}
                            >
                                {mockPeriodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Statut</label>
                        <select
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input"
                            value={form.statut ?? "BROUILLON"}
                            onChange={(e) => setForm({ ...form, statut: e.target.value as StatutBudget })}
                        >
                            <option value="BROUILLON">Brouillon</option>
                            <option value="VALIDE">Validé</option>
                            <option value="REVISE">Révisé</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button
                        disabled={!form.libelle?.trim()}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `b-${Date.now()}`,
                                libelle: form.libelle!,
                                exercice: form.exercice ?? "2026",
                                periodeId: form.periodeId!,
                                statut: form.statut ?? "BROUILLON",
                                lignes: form.lignes ?? [],
                            });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
                    >
                        {initial?.id ? "Enregistrer" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BudgetPage() {
    const [budgets, setBudgets] = useState<BudgetAnalytique[]>(mockBudgets);
    const [selectedId, setSelectedId] = useState<string>(mockBudgets[0].id);
    const [search, setSearch] = useState("");
    const [budgetModal, setBudgetModal] = useState<{ open: boolean; initial?: Partial<BudgetAnalytique> }>({ open: false });
    const [ligneModal, setLigneModal] = useState<{ open: boolean; initial?: Partial<LigneBudget> }>({ open: false });
    const [deleteLigneId, setDeleteLigneId] = useState<string | null>(null);

    const selected = budgets.find((b) => b.id === selectedId) ?? budgets[0];

    const filteredLignes = selected.lignes.filter((l) =>
        l.nature.toLowerCase().includes(search.toLowerCase()) ||
        getCentreLabel(l.centreId).toLowerCase().includes(search.toLowerCase())
    );

    const totalBudget = selected.lignes.reduce((s, l) => s + l.montantBudget, 0);
    const totalReel = selected.lignes.reduce((s, l) => s + l.montantReel, 0);
    const totalEcart = totalReel - totalBudget;
    const tauxExecution = totalBudget > 0 ? (totalReel / totalBudget) * 100 : 0;

    const chartData = filteredLignes.map((l) => ({
        name: getCentreLabel(l.centreId).slice(0, 10),
        Budget: l.montantBudget,
        Réalisé: l.montantReel,
        Écart: l.montantReel - l.montantBudget,
    }));

    const handleSaveBudget = (data: BudgetAnalytique) => {
        if (budgets.find((b) => b.id === data.id)) {
            setBudgets((p) => p.map((b) => (b.id === data.id ? { ...b, ...data } : b)));
        } else {
            setBudgets((p) => [...p, data]);
            setSelectedId(data.id);
        }
    };

    const handleSaveLigne = (data: LigneBudget) => {
        setBudgets((p) =>
            p.map((b) => {
                if (b.id !== selectedId) return b;
                const exists = b.lignes.find((l) => l.id === data.id);
                return {
                    ...b,
                    lignes: exists
                        ? b.lignes.map((l) => (l.id === data.id ? data : l))
                        : [...b.lignes, data],
                };
            })
        );
    };

    const handleDeleteLigne = (id: string) => {
        setBudgets((p) =>
            p.map((b) =>
                b.id !== selectedId ? b : { ...b, lignes: b.lignes.filter((l) => l.id !== id) }
            )
        );
        setDeleteLigneId(null);
    };

    const cfg = statutConfig[selected.statut];
    const CfgIcon = cfg.icon;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Modals */}
            {budgetModal.open && (
                <BudgetFormModal
                    initial={budgetModal.initial}
                    onClose={() => setBudgetModal({ open: false })}
                    onSave={handleSaveBudget}
                />
            )}
            {ligneModal.open && (
                <LigneModal
                    initial={ligneModal.initial}
                    onClose={() => setLigneModal({ open: false })}
                    onSave={handleSaveLigne}
                />
            )}
            {deleteLigneId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6">
                        <h3 className="text-base font-bold mb-2">Supprimer la ligne ?</h3>
                        <p className="text-sm text-muted-foreground mb-4">Cette action est irréversible.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteLigneId(null)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                            <button onClick={() => handleDeleteLigne(deleteLigneId)} className="px-4 py-2 text-sm rounded-xl bg-destructive text-destructive-foreground font-medium">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Budget Analytique</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Prévisions budgétaires par centre d&apos;analyse et suivi Budget vs Réalisé</p>
                </div>
                <button
                    onClick={() => setBudgetModal({ open: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm"
                >
                    <Plus className="h-4 w-4" /> Nouveau budget
                </button>
            </div>

            {/* Budget selector tabs */}
            <div className="flex gap-2 flex-wrap">
                {budgets.map((b) => {
                    const s = statutConfig[b.statut];
                    const SIcon = s.icon;
                    return (
                        <button
                            key={b.id}
                            onClick={() => setSelectedId(b.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selectedId === b.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-secondary"}`}
                        >
                            <SIcon className="h-3.5 w-3.5" />
                            {b.libelle}
                        </button>
                    );
                })}
            </div>

            {/* Selected budget header */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold">{selected.libelle}</h2>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                            <CfgIcon className="h-3 w-3" /> {cfg.label}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Exercice {selected.exercice} · Période : {getPeriodeLabel(selected.periodeId)}</p>
                </div>
                <button
                    onClick={() => setBudgetModal({ open: true, initial: selected })}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary"
                >
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Budget total", value: formatCurrency(totalBudget), color: "bg-indigo-100 text-indigo-600", icon: Save },
                    { label: "Réalisé", value: formatCurrency(totalReel), color: "bg-cyan-100 text-cyan-600", icon: CheckCircle2 },
                    {
                        label: "Écart global",
                        value: (totalEcart >= 0 ? "+" : "") + formatCurrency(totalEcart),
                        color: totalEcart > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600",
                        icon: totalEcart > 0 ? TrendingUp : TrendingDown,
                        sub: totalEcart > 0 ? "Dépassement" : totalEcart < 0 ? "Économie" : "Équilibré",
                    },
                    {
                        label: "Taux d'exécution",
                        value: `${tauxExecution.toFixed(1)}%`,
                        color: tauxExecution > 100 ? "bg-rose-100 text-rose-600" : tauxExecution >= 80 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600",
                        icon: AlertCircle,
                    },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                        <div className={`p-2 rounded-lg w-fit ${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
                        <p className="text-lg font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        {s.sub && <p className={`text-[10px] font-bold mt-0.5 ${totalEcart > 0 ? "text-rose-600" : "text-emerald-600"}`}>{s.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-bold mb-4">Budget vs Réalisé par centre</h3>
                <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                            <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="Budget" fill="#4f46e5" radius={[4, 4, 0, 0]} opacity={0.7} />
                            <Bar dataKey="Réalisé" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            <ReferenceLine y={0} stroke="hsl(var(--border))" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Lignes table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input"
                            placeholder="Rechercher une ligne..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setBudgets(mockBudgets)}
                            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setLigneModal({ open: true })}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" /> Ajouter une ligne
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                {["Nature de charge", "Centre", "Axe", "Budget (FCFA)", "Réalisé (FCFA)", "Écart", "Taux", ""].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLignes.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                                        Aucune ligne budgétaire. Cliquez sur &quot;Ajouter une ligne&quot;.
                                    </td>
                                </tr>
                            )}
                            {filteredLignes.map((ligne) => {
                                const ecart = ligne.montantReel - ligne.montantBudget;
                                const taux = ligne.montantBudget > 0 ? (ligne.montantReel / ligne.montantBudget) * 100 : 0;
                                return (
                                    <tr key={ligne.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{ligne.nature}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{getCentreLabel(ligne.centreId)}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{getAxeLabel(ligne.axeId)}</td>
                                        <td className="px-4 py-3 font-mono text-indigo-700 font-semibold">{formatCurrency(ligne.montantBudget)}</td>
                                        <td className="px-4 py-3 font-mono text-cyan-700 font-semibold">{formatCurrency(ligne.montantReel)}</td>
                                        <td className={`px-4 py-3 font-mono font-bold ${ecart > 0 ? "text-rose-600" : ecart < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                                            {ecart > 0 ? "+" : ""}{formatCurrency(ecart)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden w-16">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${taux > 100 ? "bg-rose-500" : taux >= 80 ? "bg-emerald-500" : "bg-amber-400"}`}
                                                        style={{ width: `${Math.min(taux, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold w-10 text-right ${taux > 100 ? "text-rose-600" : taux >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {taux.toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setLigneModal({ open: true, initial: ligne })}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteLigneId(ligne.id)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {filteredLignes.length > 0 && (
                            <tfoot className="bg-muted/30 border-t-2 border-border">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 font-bold text-foreground">Total</td>
                                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{formatCurrency(totalBudget)}</td>
                                    <td className="px-4 py-3 font-mono font-bold text-cyan-700">{formatCurrency(totalReel)}</td>
                                    <td className={`px-4 py-3 font-mono font-bold ${totalEcart > 0 ? "text-rose-600" : totalEcart < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                                        {totalEcart > 0 ? "+" : ""}{formatCurrency(totalEcart)}
                                    </td>
                                    <td colSpan={2} className="px-4 py-3">
                                        <span className={`text-sm font-bold ${tauxExecution > 100 ? "text-rose-600" : tauxExecution >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                                            {tauxExecution.toFixed(1)}% exécuté
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
