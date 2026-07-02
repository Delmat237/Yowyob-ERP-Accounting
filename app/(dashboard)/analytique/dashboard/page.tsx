"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useAnalytiqueDashboard } from "@/hooks/use-analytique-dashboard";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Button } from "@/components/ui/button";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import {
    Layers, Wallet, TrendingUp, BarChart3,
    AlertCircle, CheckCircle2, Clock, RefreshCw, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({
    title, value, sub, icon: Icon, color, badge,
}: {
    title: string; value: string; sub?: string;
    icon: React.ElementType; color: string; badge?: string;
}) {
    return (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {badge && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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

export default function AnalytiqueDashboardPage() {
    const {
        loading, partialError, refresh,
        axesTotal, axesActifs,
        budgetsAnalytiques, budgetAlloue, budgetConsomme, budgetTaux,
        budgetParAxe, budgetBarData,
        periodes, periodeEnCours, periodesOuvertes,
        exerciceLibelle, vsRealise,
    } = useAnalytiqueDashboard();

    const handleRefresh = async () => {
        try {
            await refresh();
            toast.success("Tableau de bord actualisé");
        } catch {
            toast.error("Impossible d'actualiser les données");
        }
    };

    if (loading) {
        return <CustomPageLoader message="Chargement du tableau de bord..." />;
    }

    const pieData = budgetParAxe
        .filter((a) => a.alloue > 0)
        .map((a) => ({ name: a.name, value: a.alloue }));

    const tauxVsRealise = vsRealise?.tauxRealisation != null
        ? `${vsRealise.tauxRealisation.toFixed(1)} %`
        : `${budgetTaux.toFixed(1)} %`;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {exerciceLibelle ? (
                            <>Exercice : <span className="font-medium text-foreground">{exerciceLibelle}</span></>
                        ) : (
                            "Synthèse des axes, budgets et périodes"
                        )}
                        {periodeEnCours && (
                            <> · Période en cours : <span className="font-medium text-foreground">{periodeEnCours}</span></>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {partialError && (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            Certaines données n&apos;ont pas pu être chargées
                        </span>
                    )}
                    {periodesOuvertes > 0 && (
                        <span className="flex items-center gap-1.5 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
                            <AlertCircle className="h-4 w-4" />
                            {periodesOuvertes} période(s) ouverte(s)
                        </span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Actualiser
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Budget alloué"
                    value={formatCurrency(budgetAlloue)}
                    sub={`${budgetsAnalytiques.length} budget(s) analytique(s)`}
                    icon={Wallet}
                    color="bg-indigo-100 text-indigo-600"
                />
                <StatCard
                    title="Budget consommé"
                    value={formatCurrency(budgetConsomme)}
                    sub={vsRealise ? "Inclut le suivi vs réalisé" : "Suivi en temps réel"}
                    icon={TrendingUp}
                    color="bg-cyan-100 text-cyan-600"
                    badge={tauxVsRealise}
                />
                <StatCard
                    title="Axes analytiques"
                    value={String(axesActifs)}
                    sub={`${axesTotal} axe(s) au total`}
                    icon={Layers}
                    color="bg-emerald-100 text-emerald-600"
                />
                <StatCard
                    title="Écart budgétaire"
                    value={formatCurrency(vsRealise?.totalEcart ?? budgetAlloue - budgetConsomme)}
                    sub={`Taux de réalisation : ${tauxVsRealise}`}
                    icon={BarChart3}
                    color="bg-violet-100 text-violet-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Budget vs consommé par budget</h3>
                    {budgetBarData.length > 0 ? (
                        <ChartContainer height={240}>
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
                        <div className="h-[240px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                            <p>Aucun budget analytique enregistré.</p>
                            <Link href="/accounting/budgets" className="text-primary hover:underline flex items-center gap-1">
                                Créer un budget <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par axe</h3>
                    {pieData.length > 0 ? (
                        <ChartContainer height={240}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="45%"
                                    innerRadius={45} outerRadius={75}
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
                        <div className="h-[240px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                            <p>Aucune ventilation par axe.</p>
                            <Link href="/accounting/analytics" className="text-primary hover:underline flex items-center gap-1">
                                Gérer les axes <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Suivi budgétaire par axe</h3>
                    {budgetParAxe.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                                        <th className="pb-2 font-medium">Axe</th>
                                        <th className="pb-2 font-medium text-right">Alloué</th>
                                        <th className="pb-2 font-medium text-right">Consommé</th>
                                        <th className="pb-2 font-medium text-right">Taux</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {budgetParAxe.map((row) => {
                                        const taux = row.alloue > 0 ? (row.consomme / row.alloue) * 100 : 0;
                                        return (
                                            <tr key={row.name} className="border-b border-border/50 last:border-0">
                                                <td className="py-2.5 font-medium">{row.name}</td>
                                                <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(row.alloue)}</td>
                                                <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(row.consomme)}</td>
                                                <td className="py-2.5 text-right">
                                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                                                        taux > 100 ? "bg-rose-100 text-rose-700"
                                                            : taux > 80 ? "bg-amber-100 text-amber-700"
                                                                : "bg-emerald-100 text-emerald-700"
                                                    }`}>
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
                    <h3 className="text-sm font-semibold text-foreground mb-4">Périodes comptables (CG)</h3>
                    <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto">
                        {periodes.length > 0 ? periodes.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                    {p.statut === "CLOTURE" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    ) : p.statut === "EN_COURS" ? (
                                        <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                    )}
                                    <span className="text-muted-foreground truncate">{p.libelle}</span>
                                </div>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                    p.statut === "CLOTURE" ? "bg-emerald-100 text-emerald-700"
                                        : p.statut === "EN_COURS" ? "bg-amber-100 text-amber-700"
                                            : "bg-muted text-muted-foreground"
                                }`}>
                                    {p.statut === "CLOTURE" ? "Clôturée" : p.statut === "EN_COURS" ? "En cours" : "Ouverte"}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Aucune période chargée.</p>
                        )}
                    </div>
                    <Link
                        href="/analytique/periodes"
                        className="mt-4 text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        Liaison périodes CA / CG <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { label: "Axes analytiques", href: "/accounting/analytics" },
                    { label: "Budgets (API)", href: "/accounting/budgets" },
                    { label: "Grand livre analytique", href: "/accounting/analytics/ledger" },
                ].map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm font-medium"
                    >
                        {link.label}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
