"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
    mockPeriodes, mockPeriodesCG, mockExercicesCG,
    PeriodeAnalytique, StatutPeriode,
} from "@/lib/mock-data";
import { formatCurrency, formatDateForApi } from "@/lib/utils";
import {
    CheckCircle2, AlertCircle, Clock, Calendar,
    Lock, Link, AlertTriangle, ArrowRightLeft, X, RefreshCw
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const STATUTS: Record<StatutPeriode, { label: string; color: string; icon: React.ElementType }> = {
    OUVERT: { label: "Ouverte", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Calendar },
    EN_COURS: { label: "En cours", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    CLOTURE: { label: "Clôturée", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

// ─── Modal de liaison CG ──────────────────────────────────────────────────────
function LiaisonCGModal({
    periodeCA,
    onClose,
    onSave,
}: { periodeCA: PeriodeAnalytique; onClose: () => void; onSave: (periodeCGId: string) => void }) {
    const [selected, setSelected] = useState(periodeCA.periodeCGId ?? "");
    // Filtre : périodes CG dont les dates chevauchent la période CA
    const compatibles = mockPeriodesCG.filter((cg) =>
        cg.dateDebut <= periodeCA.dateFin && cg.dateFin >= periodeCA.dateDebut
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold">Lier à une période CG</h2>
                    <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <div className="p-6 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Sélectionnez la période de la <strong>Comptabilité Générale</strong> correspondant à
                        <strong className="text-foreground"> {periodeCA.libelle}</strong>.
                    </p>
                    <div className="space-y-2">
                        {compatibles.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Aucune période CG compatible trouvée.
                            </p>
                        )}
                        {compatibles.map((cg) => {
                            const exercice = mockExercicesCG.find((e) => e.id === cg.exerciceCGId);
                            return (
                                <button
                                    key={cg.id}
                                    onClick={() => setSelected(cg.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${selected === cg.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">{cg.code} — {cg.libelle}</p>
                                            <p className="text-xs text-muted-foreground">{exercice?.libelle ?? "—"} · {formatDateForApi(cg.dateDebut)} → {formatDateForApi(cg.dateFin)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cg.cloturee ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                                {cg.cloturee ? "Clôturée" : "Ouverte"}
                                            </span>
                                            {cg.resultatNet !== 0 && (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    Résultat : {formatCurrency(cg.resultatNet)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary">Annuler</button>
                    <button
                        disabled={!selected}
                        onClick={() => { onSave(selected); onClose(); }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
                    >
                        Lier cette période
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PeriodesPage() {
    const { accountingRole } = useAuth();
    const isResponsable = accountingRole === "RESPONSABLE_COMPTABLE";
    const [periodes, setPeriodes] = useState<PeriodeAnalytique[]>(mockPeriodes);
    const [liaisonModal, setLiaisonModal] = useState<PeriodeAnalytique | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleStatutChange = (id: string, newStatut: StatutPeriode) => {
        setPeriodes((p) => p.map((per) => per.id === id ? { ...per, statut: newStatut } : per));
    };

    const handleLierCG = (periodeCAId: string, periodeCGId: string) => {
        setPeriodes((p) => p.map((per) => per.id === periodeCAId ? { ...per, periodeCGId } : per));
    };

    /**
     * Détecte une désynchronisation :
     * si la période CG est clôturée mais la période CA ne l'est pas encore.
     */
    const isDesynchro = (p: PeriodeAnalytique) => {
        if (!p.periodeCGId) return false;
        const cg = mockPeriodesCG.find((cg) => cg.id === p.periodeCGId);
        return cg?.cloturee && p.statut !== "CLOTURE";
    };

    const handleSynchronize = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setPeriodes((prev) => prev.map(p => {
                const cg = mockPeriodesCG.find(cg => cg.id === p.periodeCGId);
                if (cg?.cloturee && p.statut !== "CLOTURE") {
                    return { ...p, statut: "CLOTURE" };
                }
                return p;
            }));
            setIsSyncing(false);
        }, 800);
    };

    const desynchros = periodes.filter(isDesynchro);

    return (
        <div className="space-y-6 animate-fade-in-up">

            {/* Liaison CG modal */}
            {liaisonModal && (
                <LiaisonCGModal
                    periodeCA={liaisonModal}
                    onClose={() => setLiaisonModal(null)}
                    onSave={(cgId) => handleLierCG(liaisonModal.id, cgId)}
                />
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des Périodes Analytiques</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Ouverture, arrêtés et clôtures — synchronisées avec les périodes de la Comptabilité Générale (UC-05)
                    </p>
                </div>
                {isResponsable && (
                    <button
                        onClick={handleSynchronize}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        Synchroniser avec CG
                    </button>
                )}
            </div>

            {/* Alerte rôle */}
            {!isResponsable && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>La clôture et la liaison CG sont réservées au profil <strong>Responsable Comptable</strong>. Vous êtes en consultation.</p>
                </div>
            )}

            {/* Alerte désynchronisation */}
            {desynchros.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-bold text-base">Désynchronisation détectée en clôture</p>
                        <p className="mt-1 text-rose-700/80">
                            {desynchros.map((p) => p.libelle).join(", ")} — La période est clôturée en Comptabilité Générale. Veuillez synchroniser pour figer les comptes en analytique.
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

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Ouvertes", val: periodes.filter((p) => p.statut === "OUVERT").length, color: "text-slate-600" },
                    { label: "En cours", val: periodes.find((p) => p.statut === "EN_COURS")?.libelle ?? "Aucune", color: "text-amber-600" },
                    { label: "Clôturées", val: periodes.filter((p) => p.statut === "CLOTURE").length, color: "text-emerald-600" },
                    { label: "Liées à une période CG", val: periodes.filter((p) => !!p.periodeCGId).length, color: "text-indigo-600" },
                ].map((s, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                        <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tableau */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Période CA</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Dates</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Statut CA</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Période CG liée</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periodes.map((p) => {
                            const cgLiee = mockPeriodesCG.find((cg) => cg.id === p.periodeCGId);
                            const desync = isDesynchro(p);
                            const SIcon = STATUTS[p.statut].icon;
                            return (
                                <tr
                                    key={p.id}
                                    className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${desync ? "bg-rose-50/20" : p.statut === "EN_COURS" ? "bg-amber-50/10" : ""}`}
                                >
                                    <td className="px-5 py-4 font-bold text-foreground">
                                        {p.libelle}
                                        {desync && (
                                            <span className="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                                                ⚠ Désync.
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-muted-foreground text-xs">
                                        {formatDateForApi(p.dateDebut)} — {formatDateForApi(p.dateFin)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUTS[p.statut].color}`}>
                                            <SIcon className="h-3.5 w-3.5" />
                                            {STATUTS[p.statut].label}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {cgLiee ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
                                                    <span className="text-xs font-semibold text-indigo-700">{cgLiee.code}</span>
                                                    <span className="text-xs text-muted-foreground">{cgLiee.libelle}</span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cgLiee.cloturee ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                                    {cgLiee.cloturee ? "Clôturée" : "Ouverte"}
                                                </span>
                                                {cgLiee.resultatNet !== 0 && (
                                                    <span className="text-[10px] text-muted-foreground font-mono hidden lg:inline">
                                                        Résultat CG : {formatCurrency(cgLiee.resultatNet)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                                Non liée
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Liaison CG */}
                                            {isResponsable && p.statut !== "CLOTURE" && (
                                                <button
                                                    onClick={() => setLiaisonModal(p)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
                                                >
                                                    <Link className="h-3.5 w-3.5" />
                                                    {cgLiee ? "Modifier" : "Lier CG"}
                                                </button>
                                            )}
                                            {/* Actions de statut */}
                                            {isResponsable && p.statut === "OUVERT" && (
                                                <button
                                                    onClick={() => handleStatutChange(p.id, "EN_COURS")}
                                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-amber-200 text-amber-700 hover:bg-amber-50"
                                                >
                                                    Démarrer
                                                </button>
                                            )}
                                            {isResponsable && p.statut === "EN_COURS" && desync && (
                                                <span className="text-xs text-rose-600 font-medium italic">En attente de synchro</span>
                                            )}
                                            {p.statut === "CLOTURE" && (
                                                <span className="text-xs text-muted-foreground italic">Verrouillée</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Légende */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground text-sm mb-2">Règles de synchronisation CG/CA</p>
                <p><span className="font-bold text-foreground">Liaison obligatoire :</span> chaque période analytique doit être liée à une période CG pour permettre la concordance des résultats.</p>
                <p><span className="font-bold text-foreground">Clôture synchronisée :</span> si la période CG est clôturée, la période analytique correspondante doit l&apos;être aussi. Un badge &quot;Désync.&quot; apparaît en cas d&apos;écart.</p>
                <p><span className="font-bold text-foreground">Résultat CG visible :</span> une fois liée, le résultat net de la CG pour la période est affiché et utilisé directement dans le tableau de concordance.</p>
            </div>
        </div>
    );
}
