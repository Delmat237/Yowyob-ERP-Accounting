"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useAnalytiqueDashboard } from "@/hooks/use-analytique-dashboard";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Button } from "@/components/ui/button";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, PieChart, Pie, Cell, Legend, ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import {
    Layers, Wallet, TrendingUp,
    AlertCircle, CheckCircle2, Clock, ArrowRight,
    Building2, Calendar, AlertTriangle, XCircle, FileClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const TYPE_COLORS: Record<string, string> = {
    Annuel: "#4f46e5",
    Mensuel: "#06b6d4",
    Analytique: "#10b981",
};
const SANTE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

function StatCard({
    title, value, sub, icon: Icon, color, badge, badgeTone = "success",
}: {
    title: string; value: string; sub?: string;
    icon: React.ElementType; color: string;
    badge?: string;
    badgeTone?: "success" | "warning" | "danger";
}) {
    const badgeClass = {
        success: "text-emerald-600 bg-emerald-50",
        warning: "text-amber-600 bg-amber-50",
        danger: "text-rose-600 bg-rose-50",
    }[badgeTone];

    return (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl", color)}>
                    <Icon className="h-5 w-5" />
                </div>
                {badge && (
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", badgeClass)}>
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
            <p className="text-sm font-medium text-foreground/80">{title}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
    );
}

function ConsumptionBar({ taux }: { taux: number }) {
    const color = taux > 100 ? "bg-rose-500" : taux >= 80 ? "bg-amber-500" : "bg-emerald-500";
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Consommation globale</span>
                <span className="font-semibold text-foreground">{taux.toFixed(1)} %</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", color)}
                    style={{ width: `${Math.min(100, taux)}%` }}
                />
            </div>
        </div>
    );
}

const TYPE_LABELS: Record<string, string> = {
    EXERCICE: "Annuel",
    PERIODE: "Mensuel",
    ANALYTIQUE: "Analytique",
};

export default function AnalytiqueDashboardPage() {
    const {
        loading, partialError,
        axesTotal, axesActifs,
        budgets, budgetsAnnuel, budgetsMensuel,
        budgetAlloue, budgetConsomme, budgetTaux,
        budgetParAxe, budgetBarData, alertesBudgets,
        periodes, periodeEnCours, periodesOuvertes,
        exerciceLibelle, vsRealise,
        ecrituresValidees, montantEcrituresValidees,
    } = useAnalytiqueDashboard();

    if (loading) {
        return <CustomPageLoader message="Chargement du tableau de bord..." />;
    }

    const pieData = budgetParAxe
        .filter((a) => a.alloue > 0)
        .map((a) => ({ name: a.name, value: a.alloue }));

    const tauxVsRealise = vsRealise?.tauxRealisation != null
        ? vsRealise.tauxRealisation
        : budgetTaux;

    const ecartGlobal = vsRealise?.totalEcart ?? budgetAlloue - budgetConsomme;
    const ecartPositif = ecartGlobal >= 0;

    const badgeTone = tauxVsRealise > 100 ? "danger" as const
        : tauxVsRealise >= 80 ? "warning" as const
            : "success" as const;

    const budgetParTypeData = (() => {
        const sums = { EXERCICE: 0, PERIODE: 0, ANALYTIQUE: 0 };
        for (const b of budgets) {
            const key = b.type as keyof typeof sums;
            const montant = b.montantAlloue ?? 0;
            if (key in sums) sums[key] += montant;
        }
        return [
            { name: "Annuel", value: sums.EXERCICE },
            { name: "Mensuel", value: sums.PERIODE },
            { name: "Analytique", value: sums.ANALYTIQUE },
        ].filter((d) => d.value > 0);
    })();

    const budgetSanteData = (() => {
        const depassement = alertesBudgets.filter((a) => a.statut === "depassement").length;
        const alerte = alertesBudgets.filter((a) => a.statut === "alerte").length;
        const conforme = Math.max(0, budgets.length - depassement - alerte);
        return [
            { name: "Conforme", value: conforme },
            { name: "Alerte", value: alerte },
            { name: "Dépassement", value: depassement },
        ].filter((d) => d.value > 0);
    })();

    const tauxParAxeData = budgetParAxe
        .map((a) => ({
            name: a.name.length > 14 ? `${a.name.slice(0, 14)}…` : a.name,
            taux: a.alloue > 0 ? Math.round((a.consomme / a.alloue) * 100) : 0,
        }))
        .slice(0, 8);

    const ecartParAxeData = budgetParAxe
        .map((a) => ({
            name: a.name.length > 14 ? `${a.name.slice(0, 14)}…` : a.name,
            ecart: a.alloue - a.consomme,
        }))
        .slice(0, 8);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* En-tête */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-50/80 via-card to-cyan-50/50 p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Tableau de bord analytique</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {exerciceLibelle ? (
                                <>Exercice <span className="font-medium text-foreground">{exerciceLibelle}</span></>
                            ) : (
                                "Synthèse budgétaire et axes analytiques"
                            )}
                            {periodeEnCours && (
                                <> · Période <span className="font-medium text-foreground">{periodeEnCours}</span></>
                            )}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/80 border border-border px-2.5 py-1 rounded-lg">
                                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                                {budgetsAnnuel} annuel{budgetsAnnuel > 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/80 border border-border px-2.5 py-1 rounded-lg">
                                <Calendar className="h-3.5 w-3.5 text-cyan-600" />
                                {budgetsMensuel} mensuel{budgetsMensuel > 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/80 border border-border px-2.5 py-1 rounded-lg">
                                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                                {axesActifs} axe{axesActifs > 1 ? "s" : ""} actif{axesActifs > 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {partialError && (
                            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                Données partielles
                            </span>
                        )}
                        {alertesBudgets.length > 0 && (
                            <span className="flex items-center gap-1.5 text-sm bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200">
                                <AlertTriangle className="h-4 w-4" />
                                {alertesBudgets.length} alerte{alertesBudgets.length > 1 ? "s" : ""}
                            </span>
                        )}
                        {periodesOuvertes > 0 && (
                            <span className="flex items-center gap-1.5 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
                                <AlertCircle className="h-4 w-4" />
                                {periodesOuvertes} période(s) ouverte(s)
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-5 pt-5 border-t border-border/60">
                    <ConsumptionBar taux={tauxVsRealise} />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Budget alloué"
                    value={formatCurrency(budgetAlloue)}
                    sub={`${budgets.length} budget(s) au total`}
                    icon={Wallet}
                    color="bg-indigo-100 text-indigo-600"
                />
                <StatCard
                    title="Budget consommé"
                    value={formatCurrency(budgetConsomme)}
                    sub="Montants réalisés cumulés"
                    icon={TrendingUp}
                    color="bg-cyan-100 text-cyan-600"
                    badge={`${tauxVsRealise.toFixed(1)} %`}
                    badgeTone={badgeTone}
                />
                <StatCard
                    title="Écart budgétaire"
                    value={formatCurrency(Math.abs(ecartGlobal))}
                    sub={ecartPositif ? "Sous-consommation (disponible)" : "Sur-consommation"}
                    icon={ecartPositif ? CheckCircle2 : XCircle}
                    color={ecartPositif ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}
                />
                <StatCard
                    title="Écritures validées"
                    value={String(ecrituresValidees)}
                    sub={`${formatCurrency(montantEcrituresValidees)} cumulé`}
                    icon={FileClock}
                    color="bg-emerald-100 text-emerald-600"
                />
            </div>

            {/* Synthèse vs réalisé API */}
            {vsRealise && (vsRealise.totalBudget != null || vsRealise.totalRealise != null) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">Budget exercice (API)</p>
                        <p className="text-xl font-bold text-foreground">
                            {formatCurrency(vsRealise.totalBudget ?? 0)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
                        <p className="text-xs font-medium text-cyan-600 uppercase tracking-wider mb-1">Réalisé exercice</p>
                        <p className="text-xl font-bold text-foreground">
                            {formatCurrency(vsRealise.totalRealise ?? 0)}
                        </p>
                    </div>
                    <div className={cn(
                        "rounded-2xl border p-4",
                        (vsRealise.totalEcart ?? 0) >= 0
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-rose-200 bg-rose-50/40"
                    )}>
                        <p className="text-xs font-medium uppercase tracking-wider mb-1 text-muted-foreground">Écart exercice</p>
                        <p className="text-xl font-bold text-foreground">
                            {formatCurrency(Math.abs(vsRealise.totalEcart ?? 0))}
                        </p>
                    </div>
                </div>
            )}

            {/* État sain */}
            {alertesBudgets.length === 0 && budgets.length > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>Tous les budgets sont dans les limites prévues — aucune alerte active.</span>
                </div>
            )}

            {/* Alertes budgétaires */}
            {alertesBudgets.length > 0 && (
                <div className="bg-card rounded-2xl border border-rose-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                            Budgets en alerte ou dépassement
                        </h3>
                        <Link href="/analytique/budget" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Voir Budget vs Réalisé <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {alertesBudgets.slice(0, 6).map((a) => (
                            <div
                                key={a.id}
                                className={cn(
                                    "rounded-xl border p-3 text-sm",
                                    a.statut === "depassement"
                                        ? "border-rose-200 bg-rose-50/50"
                                        : "border-amber-200 bg-amber-50/50"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="font-medium text-foreground truncate">{a.nom}</p>
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                                        a.statut === "depassement" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {a.taux.toFixed(0)} %
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {TYPE_LABELS[a.type] ?? a.type} · {formatCurrency(a.montantConsomme)} / {formatCurrency(a.montantAlloue)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Budget vs consommé</h3>
                        <Link href="/accounting/budgets" className="text-xs text-primary hover:underline">
                            Suivi budgétaire →
                        </Link>
                    </div>
                    {budgetBarData.length > 0 ? (
                        <ChartContainer height={260}>
                            <BarChart data={budgetBarData} margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend />
                                <Bar dataKey="budget" name="Alloué" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="realise" name="Consommé" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[260px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                            <Wallet className="h-10 w-10 opacity-20" />
                            <p>Aucun budget enregistré.</p>
                            <Link href="/accounting/budgets" className="text-primary hover:underline flex items-center gap-1">
                                Créer un budget <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par axe</h3>
                    {pieData.length > 0 ? (
                        <ChartContainer height={260}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="45%"
                                    innerRadius={50} outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[260px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                            <Layers className="h-10 w-10 opacity-20" />
                            <p>Aucune ventilation par axe.</p>
                            <Link href="/accounting/analytics" className="text-primary hover:underline flex items-center gap-1">
                                Gérer les axes <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Tableau + périodes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Suivi par axe analytique</h3>
                    {budgetParAxe.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                                        <th className="pb-2 font-medium">Axe</th>
                                        <th className="pb-2 font-medium text-right">Alloué</th>
                                        <th className="pb-2 font-medium text-right">Consommé</th>
                                        <th className="pb-2 font-medium w-32">Progression</th>
                                        <th className="pb-2 font-medium text-right">Taux</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {budgetParAxe.map((row) => {
                                        const taux = row.alloue > 0 ? (row.consomme / row.alloue) * 100 : 0;
                                        const barColor = taux > 100 ? "bg-rose-500" : taux >= 80 ? "bg-amber-500" : "bg-emerald-500";
                                        return (
                                            <tr key={row.name} className="border-b border-border/50 last:border-0">
                                                <td className="py-3 font-medium">{row.name}</td>
                                                <td className="py-3 text-right font-mono text-xs">{formatCurrency(row.alloue)}</td>
                                                <td className="py-3 text-right font-mono text-xs">{formatCurrency(row.consomme)}</td>
                                                <td className="py-3">
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full", barColor)}
                                                            style={{ width: `${Math.min(100, taux)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className={cn(
                                                        "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                                                        taux > 100 ? "bg-rose-100 text-rose-700"
                                                            : taux >= 80 ? "bg-amber-100 text-amber-700"
                                                                : "bg-emerald-100 text-emerald-700"
                                                    )}>
                                                        {taux.toFixed(0)} %
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            Associez des axes à vos budgets pour voir le détail ici.
                        </p>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Périodes comptables</h3>
                    <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
                        {periodes.length > 0 ? periodes.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                    {p.statut === "CLOTURE" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                    ) : p.statut === "EN_COURS" ? (
                                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <span className="text-foreground font-medium truncate block">{p.libelle}</span>
                                        <span className="text-[10px] text-muted-foreground">{p.dateDebut} → {p.dateFin}</span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                                    p.statut === "CLOTURE" ? "bg-emerald-100 text-emerald-700"
                                        : p.statut === "EN_COURS" ? "bg-amber-100 text-amber-700"
                                            : "bg-muted text-muted-foreground"
                                )}>
                                    {p.statut === "CLOTURE" ? "Clôturée" : p.statut === "EN_COURS" ? "En cours" : "Ouverte"}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Aucune période chargée.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Diagrammes complémentaires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par type de budget</h3>
                    {budgetParTypeData.length > 0 ? (
                        <ChartContainer height={220}>
                            <PieChart>
                                <Pie
                                    data={budgetParTypeData}
                                    cx="50%" cy="50%"
                                    innerRadius={45} outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {budgetParTypeData.map((d) => (
                                        <Cell key={d.name} fill={TYPE_COLORS[d.name] ?? COLORS[0]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-16">Aucun budget alloué.</p>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">État sanitaire des budgets</h3>
                    {budgets.length > 0 ? (
                        <ChartContainer height={220}>
                            <PieChart>
                                <Pie
                                    data={budgetSanteData}
                                    cx="50%" cy="50%"
                                    innerRadius={45} outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {budgetSanteData.map((_, i) => (
                                        <Cell key={i} fill={SANTE_COLORS[i % SANTE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => `${v} budget(s)`} />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-16">Aucun budget à analyser.</p>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Taux de consommation par axe (%)</h3>
                    {tauxParAxeData.length > 0 ? (
                        <ChartContainer height={220}>
                            <BarChart layout="vertical" data={tauxParAxeData} margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                <XAxis type="number" domain={[0, "dataMax"]} tick={{ fontSize: 10 }} unit=" %" />
                                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v: number) => `${v} %`} />
                                <ReferenceLine x={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "80 %", fontSize: 9, fill: "#f59e0b" }} />
                                <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "100 %", fontSize: 9, fill: "#ef4444" }} />
                                <Bar
                                    dataKey="taux"
                                    name="Taux"
                                    radius={[0, 4, 4, 0]}
                                    fill="#4f46e5"
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-16">Aucun axe associé aux budgets.</p>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Écart disponible par axe</h3>
                    {ecartParAxeData.length > 0 ? (
                        <ChartContainer height={220}>
                            <BarChart layout="vertical" data={ecartParAxeData} margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                                <Bar
                                    dataKey="ecart"
                                    name="Écart"
                                    radius={[0, 4, 4, 0]}
                                >
                                    {ecartParAxeData.map((entry, i) => (
                                        <Cell key={i} fill={entry.ecart >= 0 ? "#10b981" : "#ef4444"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-16">Aucun écart à afficher.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
