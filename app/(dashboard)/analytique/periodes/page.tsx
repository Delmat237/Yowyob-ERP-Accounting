"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { StatutPeriode } from "@/lib/analytique/mock-data";
import { isPeriodeDesynchronisee, resolvePeriodeCG } from "@/lib/analytique/periodes-alignees";
import { usePeriodesAnalytiquesAlignees } from "@/hooks/use-periodes-analytiques-alignees";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import {
    CheckCircle2, AlertCircle, Clock, Calendar,
    Lock, AlertTriangle, ArrowRightLeft, RefreshCw, Loader2, Link2,
} from "lucide-react";

const STATUTS: Record<StatutPeriode, { label: string; color: string; icon: React.ElementType }> = {
    OUVERT: { label: "Ouverte", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Calendar },
    EN_COURS: { label: "En cours", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    CLOTURE: { label: "Clôturée", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

export default function PeriodesPage() {
    const { accountingRole } = useAuth();
    const isResponsable = accountingRole === "RESPONSABLE_COMPTABLE";
    const {
        periodes,
        periodesCG,
        exercices,
        loading,
        error,
        usingMockFallback,
        reload,
        setStatutLocal,
        synchroniserClotures,
    } = usePeriodesAnalytiquesAlignees();
    const [isSyncing, setIsSyncing] = useState(false);

    const desynchros = periodes.filter((p) => isPeriodeDesynchronisee(p, periodesCG));

    const handleSynchronize = async () => {
        setIsSyncing(true);
        synchroniserClotures();
        await reload();
        setIsSyncing(false);
    };

    const exerciceLabel = (exerciceId: string) =>
        exercices.find((e) => e.id === exerciceId)?.libelle ??
        exercices.find((e) => e.id === exerciceId)?.code ??
        "—";

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Périodes analytiques</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Calendrier aligné sur la comptabilité générale — une période analytique = une période comptable (mêmes dates).
                    </p>
                </div>
                {isResponsable && (
                    <button
                        onClick={handleSynchronize}
                        disabled={isSyncing || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing || loading ? "animate-spin" : ""}`} />
                        Actualiser
                    </button>
                )}
            </div>

            <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
                <Link2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                    Les exercices et périodes analytiques reprennent automatiquement ceux de la{" "}
                    <strong>comptabilité générale</strong>. La clôture analytique suit la clôture CG.
                </p>
            </div>

            {error && (
                <div className={`rounded-xl p-4 flex gap-3 text-sm border ${usingMockFallback ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {!isResponsable && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>La clôture analytique est réservée au profil <strong>Responsable Comptable</strong>. Vous êtes en consultation.</p>
                </div>
            )}

            {desynchros.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-bold text-base">Clôture CG non répercutée en analytique</p>
                        <p className="mt-1 text-rose-700/80">
                            {desynchros.map((p) => p.libelle).join(", ")} — clôturée(s) en CG, ouverte(s) en analytique.
                        </p>
                    </div>
                    {isResponsable && (
                        <button
                            onClick={handleSynchronize}
                            disabled={isSyncing}
                            className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-700 transition flex items-center justify-center flex-shrink-0"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                            Synchroniser
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Ouvertes", val: periodes.filter((p) => p.statut === "OUVERT").length, color: "text-slate-600" },
                    { label: "En cours", val: periodes.find((p) => p.statut === "EN_COURS")?.libelle ?? "Aucune", color: "text-amber-600" },
                    { label: "Clôturées", val: periodes.filter((p) => p.statut === "CLOTURE").length, color: "text-emerald-600" },
                    { label: "Alignées CG", val: periodes.length, color: "text-indigo-600" },
                ].map((s, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                        <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Chargement des périodes…
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Période</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Exercice CG</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Dates</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Statut analytique</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Statut CG</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periodes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground italic">
                                        Aucune période comptable. Créez les périodes dans la comptabilité générale.
                                    </td>
                                </tr>
                            ) : (
                                periodes.map((p) => {
                                    const cg = resolvePeriodeCG(p, periodesCG);
                                    const desync = isPeriodeDesynchronisee(p, periodesCG);
                                    const SIcon = STATUTS[p.statut].icon;
                                    return (
                                        <tr
                                            key={p.id}
                                            className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${desync ? "bg-rose-50/20" : p.statut === "EN_COURS" ? "bg-amber-50/10" : ""}`}
                                        >
                                            <td className="px-5 py-4 font-bold text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
                                                    {cg?.code ?? p.id} — {p.libelle}
                                                </div>
                                                {desync && (
                                                    <span className="mt-1 inline-block text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                                                        Clôture à synchroniser
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-muted-foreground">
                                                {exerciceLabel(p.exerciceId)}
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground text-xs">
                                                {formatDateDisplay(p.dateDebut)} — {formatDateDisplay(p.dateFin)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUTS[p.statut].color}`}>
                                                    <SIcon className="h-3.5 w-3.5" />
                                                    {STATUTS[p.statut].label}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {cg ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex w-fit text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cg.cloturee ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                                            {cg.cloturee ? "Clôturée" : "Ouverte"}
                                                        </span>
                                                        {cg.resultatNet !== 0 && (
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                Résultat : {formatCurrency(cg.resultatNet)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isResponsable && p.statut === "OUVERT" && !cg?.cloturee && (
                                                        <button
                                                            onClick={() => setStatutLocal(p.id, "EN_COURS")}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-amber-200 text-amber-700 hover:bg-amber-50"
                                                        >
                                                            Démarrer
                                                        </button>
                                                    )}
                                                    {p.statut === "CLOTURE" && (
                                                        <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                                            <Lock className="h-3 w-3" />
                                                            Verrouillée
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="bg-muted/20 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground text-sm mb-2">Règles d&apos;alignement (par défaut)</p>
                <p><span className="font-bold text-foreground">Exercice :</span> l&apos;exercice analytique est l&apos;exercice comptable (<code className="text-[10px]">exercice_id</code>).</p>
                <p><span className="font-bold text-foreground">Période :</span> même identifiant, mêmes dates de début et de fin que la période CG.</p>
                <p><span className="font-bold text-foreground">Clôture :</span> lorsque la CG clôture un mois, l&apos;analytique doit être synchronisé (bouton Actualiser).</p>
            </div>
        </div>
    );
}
