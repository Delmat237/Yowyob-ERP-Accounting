"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { FileText, Download, Printer, Filter, ChevronDown, CheckCircle2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
    mockPeriodes,
    mockCoutsProduits,
    mockCentres,
    mockChargesVentilees,
    mockPeriodesCG,
    mockLignesConcordance,
    PeriodeAnalytique,
} from "@/lib/mock-data";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

// ─── Helpers de calcul ────────────────────────────────────────────────────────
function calcProduits(periodeId: string) {
    return mockCoutsProduits
        .filter((p) => p.periodeId === periodeId)
        .map((p) => ({
            id: p.id,
            libelle: p.produitLibelle,
            CA: Math.round(p.coutRevient * 1.35),
            CV: Math.round(p.coutProduction * 0.85),
            CFspec: Math.round(p.coutProduction * 0.12),
            coutAchat: p.coutAchat,
        }));
}

function calcRepartitionCentres(periodeId: string) {
    const charges = mockChargesVentilees.filter(
        (cv) => cv.periodeId === periodeId && cv.incorporable
    );
    const parCentre: Record<string, number> = {};
    for (const charge of charges) {
        for (const v of charge.ventilations) {
            parCentre[v.centreId] = (parCentre[v.centreId] ?? 0) + (charge.montantTotal * v.pourcentage) / 100;
        }
    }
    return mockCentres
        .filter((c) => c.actif)
        .map((c) => ({
            id: c.id,
            libelle: c.libelle,
            nature: c.nature,
            uniteOeuvre: c.uniteOeuvre,
            montant: Math.round(parCentre[c.id] ?? 0),
        }))
        .filter((c) => c.montant > 0);
}

function calcConcordance(periodeId: string) {
    const periode = mockPeriodes.find((p) => p.id === periodeId);
    const periodeCG = periode ? mockPeriodesCG.find((cg) => cg.id === periode.periodeCGId) : null;
    const chargesNonInc = mockChargesVentilees
        .filter((cv) => cv.periodeId === periodeId && !cv.incorporable)
        .reduce((s, cv) => s + cv.montantTotal, 0);
    const ajustements = mockLignesConcordance.reduce(
        (s, l) => s + (l.signe === "+" ? l.montant : -l.montant),
        0
    );
    return {
        periodeCG,
        resultatCG: periodeCG?.resultatNet ?? 0,
        totalChargesCG: periodeCG?.totalChargesCG ?? 0,
        totalProduitsCG: periodeCG?.totalProduitsCG ?? 0,
        chargesNonInc,
        ajustements,
        lignes: mockLignesConcordance,
        resultatCA: (periodeCG?.resultatNet ?? 0) + ajustements,
    };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EtatsReportingPage() {
    const [reportType, setReportType] = useState<"resultats" | "repartition" | "concordance">("resultats");
    const [periodeId, setPeriodeId] = useState<string>(
        mockPeriodes.find((p) => p.statut === "EN_COURS")?.id ?? mockPeriodes[0].id
    );
    const [showDropdown, setShowDropdown] = useState(false);

    const selectedPeriode: PeriodeAnalytique =
        mockPeriodes.find((p) => p.id === periodeId) ?? mockPeriodes[0];

    const produits = useMemo(() => calcProduits(periodeId), [periodeId]);
    const repartition = useMemo(() => calcRepartitionCentres(periodeId), [periodeId]);
    const concordance = useMemo(() => calcConcordance(periodeId), [periodeId]);

    const caTotal = useMemo(() => produits.reduce((s, p) => s + p.CA, 0), [produits]);
    const cvTotal = useMemo(() => produits.reduce((s, p) => s + p.CV, 0), [produits]);
    const mcvTotal = useMemo(() => caTotal - cvTotal, [caTotal, cvTotal]);
    const cfSpecTotal = useMemo(() => produits.reduce((s, p) => s + p.CFspec, 0), [produits]);
    const fraisCommuns = useMemo(
        () => Math.round(produits.reduce((s, p) => s + p.coutAchat, 0) * 0.1),
        [produits]
    );
    const resultatAnalytique = useMemo(() => mcvTotal - cfSpecTotal - fraisCommuns, [mcvTotal, cfSpecTotal, fraisCommuns]);

    const pieData = useMemo(() => {
        const principaux = repartition.filter((c) => c.nature.includes("PRINCIPAL")).reduce((s, c) => s + c.montant, 0);
        const auxiliaires = repartition.filter((c) => c.nature.includes("AUXILIAIRE")).reduce((s, c) => s + c.montant, 0);
        const fraisNonRep = Math.max(0, fraisCommuns - principaux - auxiliaires);
        const data = [];
        if (principaux > 0) data.push({ name: "Centres Principaux", value: principaux });
        if (auxiliaires > 0) data.push({ name: "Centres Auxiliaires", value: auxiliaires });
        if (fraisNonRep > 0) data.push({ name: "Frais Généraux Non Répartis", value: fraisNonRep });
        return data;
    }, [repartition, fraisCommuns]);

    const totalChargesVentilees = useMemo(() => repartition.reduce((s, c) => s + c.montant, 0), [repartition]);
    const noData = produits.length === 0;

    return (
        <div className="space-y-6 animate-fade-in-up">

            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold">États Analytiques & Reporting</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Génération et exportation des états financiers analytiques (BF-06)</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
                        <Printer className="h-4 w-4" /> Imprimer
                    </button>
                    <button onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                        <Download className="h-4 w-4" /> Exporter PDF
                    </button>
                </div>
            </div>

            {/* Barre de filtres */}
            <div className="bg-card rounded-2xl border border-border p-3 shadow-sm flex items-center gap-3 flex-wrap print:hidden">
                <Filter className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
                <div className="flex border border-border rounded-xl overflow-hidden">
                    {(["resultats", "repartition", "concordance"] as const).map((id) => {
                        const labels = { resultats: "Compte de Résultats", repartition: "Synthèse Répartition", concordance: "Concordance CG/CA" };
                        return (
                            <button key={id} onClick={() => setReportType(id)}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${reportType === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                                {labels[id]}
                            </button>
                        );
                    })}
                </div>
                <div className="w-px h-8 bg-border flex-shrink-0" />
                {/* Sélecteur de période */}
                <div className="relative">
                    <button onClick={() => setShowDropdown((v) => !v)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-secondary min-w-[200px]">
                        <span>Période : {selectedPeriode.libelle}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                    </button>
                    {showDropdown && (
                        <div className="absolute top-full mt-1 left-0 z-20 bg-card border border-border rounded-xl shadow-lg min-w-[220px] overflow-hidden">
                            {mockPeriodes.map((p) => (
                                <button key={p.id}
                                    onClick={() => { setPeriodeId(p.id); setShowDropdown(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-secondary transition-colors ${p.id === periodeId ? "bg-primary/10 text-primary font-semibold" : ""}`}>
                                    <span>{p.libelle}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.statut === "CLOTURE" ? "bg-muted text-muted-foreground" : p.statut === "EN_COURS" ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100 text-cyan-700"}`}>
                                        {p.statut}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pas de données */}
            {noData && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-sm font-semibold text-amber-800">Aucun produit pour la période &ldquo;{selectedPeriode.libelle}&rdquo;.</p>
                    <p className="text-xs text-amber-600 mt-1">Sélectionnez une autre période ou enregistrez des coûts produits.</p>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ÉTAT 1 : Compte de Résultat Analytique
            ═══════════════════════════════════════════════════════════ */}
            {reportType === "resultats" && !noData && (
                <div className="space-y-4" id="print-resultats">
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
                        <h2 className="text-xl font-bold">ÉTAT 1 : Compte de Résultat Analytique</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Période : {selectedPeriode.libelle} — Édité le {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase text-xs">Désignation</th>
                                        {produits.map((p) => (
                                            <th key={p.id} className="px-5 py-3 text-right font-semibold text-muted-foreground uppercase text-xs">{p.libelle}</th>
                                        ))}
                                        <th className="px-5 py-3 text-right font-semibold text-indigo-600 uppercase text-xs">Total Ligne</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/50">
                                        <td className="px-5 py-3 font-medium">Chiffre d&apos;Affaires</td>
                                        {produits.map((p) => <td key={p.id} className="px-5 py-3 text-right font-mono text-emerald-700">{formatCurrency(p.CA)}</td>)}
                                        <td className="px-5 py-3 text-right font-mono font-bold text-indigo-700">{formatCurrency(caTotal)}</td>
                                    </tr>
                                    <tr className="border-b border-border/50 text-muted-foreground">
                                        <td className="px-5 py-3">(-) Coûts Variables</td>
                                        {produits.map((p) => <td key={p.id} className="px-5 py-3 text-right font-mono">{formatCurrency(p.CV)}</td>)}
                                        <td className="px-5 py-3 text-right font-mono font-bold">{formatCurrency(cvTotal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-border font-bold">
                                        <td className="px-5 py-3">Marge sur Coût Variable</td>
                                        {produits.map((p) => <td key={p.id} className="px-5 py-3 text-right font-mono">{formatCurrency(p.CA - p.CV)}</td>)}
                                        <td className="px-5 py-3 text-right font-mono text-indigo-700">{formatCurrency(mcvTotal)}</td>
                                    </tr>
                                    <tr className="border-b border-border/50 text-muted-foreground">
                                        <td className="px-5 py-3">(-) Coûts Fixes Spécifiques</td>
                                        {produits.map((p) => <td key={p.id} className="px-5 py-3 text-right font-mono">{formatCurrency(p.CFspec)}</td>)}
                                        <td className="px-5 py-3 text-right font-mono font-bold">{formatCurrency(cfSpecTotal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-border font-bold">
                                        <td className="px-5 py-3 text-violet-700">Marge sur Coût Spécifique</td>
                                        {produits.map((p) => <td key={p.id} className="px-5 py-3 text-right font-mono text-violet-700">{formatCurrency(p.CA - p.CV - p.CFspec)}</td>)}
                                        <td className="px-5 py-3 text-right font-mono text-violet-700">{formatCurrency(mcvTotal - cfSpecTotal)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-dashed border-border">
                                        <td className="px-5 py-3">(-) Frais Généraux Communs (Non affectables)</td>
                                        {produits.map((p) => <td key={p.id} className="px-5 py-3 text-right text-muted-foreground">—</td>)}
                                        <td className="px-5 py-3 text-right font-mono text-rose-600 bg-rose-50/50">{formatCurrency(fraisCommuns)}</td>
                                    </tr>
                                    <tr className={resultatAnalytique >= 0 ? "bg-emerald-50" : "bg-rose-50"}>
                                        <td className={`px-5 py-4 font-bold text-base ${resultatAnalytique >= 0 ? "text-emerald-900" : "text-rose-800"}`}>RÉSULTAT ANALYTIQUE</td>
                                        {produits.map((p) => {
                                            const res = p.CA - p.CV - p.CFspec;
                                            return <td key={p.id} className={`px-5 py-4 text-right font-mono font-bold text-base ${res >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(res)}</td>;
                                        })}
                                        <td className={`px-5 py-4 text-right font-mono font-bold text-lg ${resultatAnalytique >= 0 ? "text-emerald-800" : "text-rose-700"}`}>{formatCurrency(resultatAnalytique)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-xl p-3 text-xs text-muted-foreground">
                        <strong>Note :</strong> CA = Coût de revient × 1,35 | CV = Coût production × 0,85 | CF Spécifiques = Coût production × 0,12 | Frais généraux = Σ(coûts d&apos;achat) × 10%
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ÉTAT 2 : Synthèse Répartition
            ═══════════════════════════════════════════════════════════ */}
            {reportType === "repartition" && (
                <div className="space-y-4" id="print-repartition">
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-4 text-center">
                        <h2 className="text-lg font-bold">ÉTAT 2 : Synthèse des Charges par Centres d&apos;Analyse</h2>
                        <p className="text-sm text-muted-foreground mt-1">Période : {selectedPeriode.libelle}</p>
                    </div>

                    {repartition.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                            <p className="text-sm text-amber-800 font-semibold">Aucune charge ventilée incorporable pour cette période.</p>
                            <p className="text-xs text-amber-600 mt-1">Les charges ventilées sont saisies dans le module Ventilation Analytique.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
                                    <FileText className="h-8 w-8 text-primary mx-auto mb-3 opacity-50" />
                                    <h3 className="text-base font-bold mb-2">Répartition par nature de centre</h3>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
                                    <h3 className="text-base font-bold">Détail par centre d&apos;analyse</h3>
                                    {repartition.map((c) => {
                                        const pct = totalChargesVentilees > 0 ? (c.montant / totalChargesVentilees) * 100 : 0;
                                        const isPrincipal = c.nature.includes("PRINCIPAL");
                                        return (
                                            <div key={c.id} className="space-y-1.5">
                                                <div className="flex justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{c.libelle}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isPrincipal ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700"}`}>
                                                            {isPrincipal ? "Principal" : "Auxiliaire"}
                                                        </span>
                                                    </div>
                                                    <span className="font-mono text-muted-foreground">{formatCurrency(c.montant)}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">UO : {c.uniteOeuvre}</div>
                                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${isPrincipal ? "bg-indigo-500" : "bg-cyan-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                                </div>
                                                <div className="text-right text-xs text-muted-foreground">{pct.toFixed(1)}%</div>
                                            </div>
                                        );
                                    })}
                                    <div className="mt-2 pt-3 border-t border-border flex items-center justify-between bg-emerald-50 p-3 rounded-xl border-emerald-200 text-emerald-700">
                                        <span className="flex items-center gap-2 font-bold text-sm"><CheckCircle2 className="h-4 w-4" /> Total ventilé</span>
                                        <span className="font-mono text-sm font-bold">{formatCurrency(totalChargesVentilees)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-border bg-muted/20">
                                    <h3 className="text-sm font-bold">Tableau détaillé — {selectedPeriode.libelle}</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Centre</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Nature</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Unité d&apos;Œuvre</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Montant</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repartition.map((c) => {
                                            const pct = totalChargesVentilees > 0 ? (c.montant / totalChargesVentilees) * 100 : 0;
                                            return (
                                                <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/20">
                                                    <td className="px-4 py-3 font-medium">{c.libelle}</td>
                                                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.nature}</td>
                                                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.uniteOeuvre}</td>
                                                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(c.montant)}</td>
                                                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">{pct.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-muted/30 border-t border-border font-bold">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3">Total charges ventilées</td>
                                            <td className="px-4 py-3 text-right font-mono text-primary">{formatCurrency(totalChargesVentilees)}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">100%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ÉTAT 3 : Concordance Globale
            ═══════════════════════════════════════════════════════════ */}
            {reportType === "concordance" && (
                <div className="space-y-4" id="print-concordance">
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-4 text-center">
                        <h2 className="text-lg font-bold">ÉTAT 3 : Concordance CG / CA — {selectedPeriode.libelle}</h2>
                        <p className="text-sm text-muted-foreground mt-1">Rapprochement entre le résultat CG et le résultat analytique reconstitué</p>
                    </div>

                    {!concordance.periodeCG ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                            <p className="text-sm text-amber-800 font-semibold">Aucune période CG liée à cette période analytique.</p>
                            <p className="text-xs text-amber-600 mt-1">Liez la période dans le module Périodes (Janvier, Février ou Mars 2026 ont une période CG).</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: "Produits CG", val: concordance.totalProduitsCG, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                                    { label: "Charges CG", val: concordance.totalChargesCG, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
                                    { label: "Résultat Net CG", val: concordance.resultatCG, color: concordance.resultatCG >= 0 ? "text-indigo-700" : "text-rose-600", bg: "bg-indigo-50 border-indigo-200" },
                                ].map((k) => (
                                    <div key={k.label} className={`rounded-2xl border p-5 shadow-sm ${k.bg}`}>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">{k.label}</p>
                                        <p className={`text-2xl font-bold mt-1 ${k.color}`}>{formatCurrency(k.val)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Période CG : {concordance.periodeCG.libelle}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-border bg-muted/20">
                                    <h3 className="text-sm font-bold">Tableau de passage CG → CA</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Libellé</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Description</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Signe</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b-2 border-border bg-muted/10 font-bold">
                                            <td className="px-4 py-3 text-xs text-muted-foreground">DÉPART</td>
                                            <td className="px-4 py-3">Résultat net Comptabilité Générale</td>
                                            <td className="px-4 py-3 hidden md:table-cell" />
                                            <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                                            <td className="px-4 py-3 text-right font-mono text-indigo-700">{formatCurrency(concordance.resultatCG)}</td>
                                        </tr>
                                        {concordance.lignes.map((l) => (
                                            <tr key={l.id} className="border-b border-border/30 hover:bg-secondary/20">
                                                <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.type}</td>
                                                <td className="px-4 py-2.5 font-medium">{l.label}</td>
                                                <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{l.description}</td>
                                                <td className={`px-4 py-2.5 text-center font-bold text-lg ${l.signe === "+" ? "text-emerald-600" : "text-rose-500"}`}>{l.signe}</td>
                                                <td className={`px-4 py-2.5 text-right font-mono ${l.signe === "+" ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(l.montant)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-border">
                                        <tr className="bg-indigo-50">
                                            <td colSpan={2} className="px-4 py-4 font-bold text-indigo-900 text-base">Résultat Analytique Reconstitué (CG)</td>
                                            <td className="hidden md:table-cell" />
                                            <td className="px-4 py-4 text-center text-indigo-700 font-semibold">=</td>
                                            <td className={`px-4 py-4 text-right font-mono font-bold text-lg ${concordance.resultatCA >= 0 ? "text-indigo-700" : "text-rose-600"}`}>{formatCurrency(concordance.resultatCA)}</td>
                                        </tr>
                                        {!noData && (
                                            <tr className="bg-emerald-50">
                                                <td colSpan={2} className="px-4 py-3 font-bold text-emerald-900 text-sm">Résultat Analytique (Coûts Partiels)</td>
                                                <td className="hidden md:table-cell" />
                                                <td />
                                                <td className={`px-4 py-3 text-right font-mono font-bold ${resultatAnalytique >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(resultatAnalytique)}</td>
                                            </tr>
                                        )}
                                        {!noData && (
                                            <tr className="border-t border-border">
                                                <td colSpan={2} className="px-4 py-3 text-sm text-muted-foreground">Écart de concordance</td>
                                                <td className="hidden md:table-cell" />
                                                <td />
                                                <td className={`px-4 py-3 text-right font-mono font-semibold ${Math.abs(concordance.resultatCA - resultatAnalytique) < 1000 ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {formatCurrency(Math.abs(concordance.resultatCA - resultatAnalytique))}
                                                    {Math.abs(concordance.resultatCA - resultatAnalytique) < 1000 && " ✓"}
                                                </td>
                                            </tr>
                                        )}
                                    </tfoot>
                                </table>
                            </div>

                            {concordance.chargesNonInc > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">Charges non incorporables détectées sur cette période</p>
                                        <p className="text-xs text-amber-600 mt-0.5">Ces charges figurent en CG mais sont exclues du calcul analytique.</p>
                                    </div>
                                    <span className="text-lg font-bold text-amber-700 font-mono">{formatCurrency(concordance.chargesNonInc)}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* CSS print */}
            <style dangerouslySetInnerHTML={{
                __html: `@media print {
  .print\\:hidden { display: none !important; }
  #print-resultats, #print-repartition, #print-concordance { display: block; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`}} />
        </div>
    );
}
