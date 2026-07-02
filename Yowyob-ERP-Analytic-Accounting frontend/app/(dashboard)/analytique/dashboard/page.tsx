"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { mockAxes, mockCentres, mockCharges, mockPeriodes, mockCoutsProduits } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
    Layers, GitBranch, TrendingUp, FileText,
    AlertCircle, CheckCircle2, Clock, Target,
} from "lucide-react";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const chargesParCentre = [
    { centre: "Production", direct: 4300000, indirect: 900000 },
    { centre: "Distribution", direct: 1200000, indirect: 450000 },
    { centre: "Administration", direct: 800000, indirect: 320000 },
    { centre: "Entretien", direct: 0, indirect: 450000 },
    { centre: "Logistique", direct: 0, indirect: 280000 },
];

const evolutionCouts = [
    { mois: "Jan", revient: 1750000, production: 1380000, achat: 800000 },
    { mois: "Fév", revient: 1810000, production: 1430000, achat: 820000 },
    { mois: "Mar", revient: 1850000, production: 1450000, achat: 850000 },
];

const repartitionProduits = [
    { name: "Produit Alpha", value: 1850000 },
    { name: "Produit Beta", value: 1380000 },
    { name: "Produit Gamma", value: 1050000 },
];

function StatCard({
    title, value, sub, icon: Icon, color, trend,
}: {
    title: string; value: string; sub?: string;
    icon: React.ElementType; color: string; trend?: string;
}) {
    return (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
            <p className="text-sm font-medium text-foreground/80">{title}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
    );
}

export default function DashboardPage() {
    const { accountingRole, initFromStorage } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        initFromStorage();
        setMounted(true);
    }, [initFromStorage]);

    if (!mounted) return null;

    const totalCharges = mockCharges.reduce((s, c) => s + c.montant, 0);
    const chargesIncorporables = mockCharges.filter((c) => c.incorporable).reduce((s, c) => s + c.montant, 0);
    const periodeEnCours = mockPeriodes.find((p) => p.statut === "EN_COURS");
    const periodesOuvertes = mockPeriodes.filter((p) => p.statut === "OUVERT").length;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Page title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tableau de bord analytique</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Période en cours : <span className="font-medium text-foreground">{periodeEnCours?.libelle ?? "Aucune"}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <span>{periodesOuvertes} période(s) en attente de clôture</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Charges"
                    value={formatCurrency(totalCharges)}
                    sub={`${formatCurrency(chargesIncorporables)} incorporables`}
                    icon={FileText}
                    color="bg-indigo-100 text-indigo-600"
                    trend="+4.2%"
                />
                <StatCard
                    title="Axes Analytiques"
                    value={String(mockAxes.filter((a) => a.actif).length)}
                    sub={`${mockAxes.length} axes au total`}
                    icon={Layers}
                    color="bg-cyan-100 text-cyan-600"
                />
                <StatCard
                    title="Centres d'Analyse"
                    value={String(mockCentres.filter((c) => c.actif).length)}
                    sub="principaux + auxiliaires"
                    icon={GitBranch}
                    color="bg-emerald-100 text-emerald-600"
                />
                <StatCard
                    title="Produits Valorisés"
                    value={String(mockCoutsProduits.length)}
                    sub="coûts complets calculés"
                    icon={Target}
                    color="bg-violet-100 text-violet-600"
                    trend="Upd."
                />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Charges par centre — Bar */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Charges par centre d&apos;analyse</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chargesParCentre} margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="centre" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="direct" name="Directes" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="indirect" name="Indirectes" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Répartition produits — Pie */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Coûts de revient par produit</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={repartitionProduits}
                                cx="50%" cy="45%"
                                innerRadius={50} outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {repartitionProduits.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Évolution coûts — Line */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Évolution des coûts</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={evolutionCouts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            <Legend />
                            <Line type="monotone" dataKey="achat" name="Coût d'achat" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="production" name="Coût de prod." stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="revient" name="Coût de revient" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Périodes status */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Statut des périodes</h3>
                    <div className="flex flex-col gap-2">
                        {mockPeriodes.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
                                <div className="flex items-center gap-2">
                                    {p.statut === "CLOTURE" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    ) : p.statut === "EN_COURS" ? (
                                        <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                    )}
                                    <span className="text-muted-foreground">{p.libelle}</span>
                                </div>
                                <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.statut === "CLOTURE"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : p.statut === "EN_COURS"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                >
                                    {p.statut === "CLOTURE" ? "Clôturée" : p.statut === "EN_COURS" ? "En cours" : "Ouverte"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
