"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileClock, Plus, Download, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import {
    getAnalytiqueConfig,
} from "@/lib/analytique/analytique-config-store";
import {
    createEcritureAnalytique,
    listEcrituresAnalytiques,
} from "@/lib/analytique/ecritures-analytiques-store";
import { importFluxDepuisCG } from "@/lib/analytique/import-flux-cg";
import {
    getJournalAnalytiqueById,
    NATURES_CHARGE,
    type EcritureAnalytique,
} from "@/lib/analytique/ecriture-analytique";
import { formatMontantSigne } from "@/lib/analytique/ecriture-lignes";
import { mockCentres, mockExercicesCG } from "@/lib/analytique/mock-data";
import {
    EcritureAnalytiqueForm,
    type EcritureAnalytiqueFormData,
} from "@/components/analytique/ecriture-analytique-form";
import { cn } from "@/lib/utils";

const STATUT_STYLE: Record<EcritureAnalytique["statut"], string> = {
    BROUILLON: "bg-amber-100 text-amber-800",
    VALIDEE: "bg-emerald-100 text-emerald-800",
    REJETEE: "bg-rose-100 text-rose-800",
};

/** Les brouillons importés sont visibles uniquement sur la page de validation. */
function isVisibleOnEcrituresPage(e: EcritureAnalytique): boolean {
    return !(e.origine === "IMPORT_CG" && e.statut === "BROUILLON");
}

export default function EcrituresAnalytiquesPage() {
    const router = useRouter();
    const [ecritures, setEcritures] = useState<EcritureAnalytique[]>([]);
    const [search, setSearch] = useState("");
    const [importActive, setImportActive] = useState(false);
    const [importing, setImporting] = useState(false);
    const { openForm, closeForm } = useAnalytiqueCompose();

    const reload = useCallback((options?: AutoRefreshOptions) => {
        if (!options?.silent) {
            setImportActive(getAnalytiqueConfig().importComptabiliteGeneraleActive);
        }
        setEcritures(listEcrituresAnalytiques().filter(isVisibleOnEcrituresPage));
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    useAutoRefresh(reload, [reload]);

    const filtered = ecritures.filter(
        (e) =>
            e.numeroPiece.toLowerCase().includes(search.toLowerCase()) ||
            e.libelleOperation.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSaveManual = (data: EcritureAnalytiqueFormData) => {
        createEcritureAnalytique({ ...data, origine: "MANUELLE" });
        closeForm();
        reload();
        toast.success("Écriture enregistrée en brouillon", {
            description: "Validez-la depuis la section Validation des écritures analytiques.",
        });
    };

    const openManualForm = () => {
        openForm(
            "Nouvelle écriture analytique",
            <EcritureAnalytiqueForm onCancel={closeForm} onSubmit={handleSaveManual} />,
        );
    };

    const handleImportCG = async () => {
        setImporting(true);
        try {
            const { created, ignored } = importFluxDepuisCG();
            reload();
            if (created.length === 0) {
                toast.info("Aucune nouvelle ligne incorporable à importer.", {
                    description:
                        ignored > 0
                            ? `${ignored} ligne(s) non incorporable(s) ignorée(s).`
                            : "Les flux de la comptabilité générale ont déjà été importés.",
                });
            } else {
                toast.success(`${created.length} écriture(s) importée(s)`, {
                    description: "Redirection vers la validation…",
                });
                router.push("/analytique/ecritures/validation");
            }
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileClock className="h-7 w-7 text-primary" />
                        Écritures analytiques
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Saisie manuelle toujours disponible. L&apos;import depuis la comptabilité générale
                        s&apos;active dans la configuration globale.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/analytique/ecritures/validation"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
                    >
                        <ShieldCheck className="h-4 w-4" /> Validation
                    </Link>
                    <button
                        type="button"
                        onClick={openManualForm}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" /> Nouvelle écriture
                    </button>
                    {importActive && (
                        <button
                            type="button"
                            onClick={handleImportCG}
                            disabled={importing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                        >
                            <Download className={cn("h-4 w-4", importing && "animate-pulse")} />
                            Importer maintenant
                        </button>
                    )}
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-card"
                    placeholder="Rechercher par n° pièce ou libellé…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                            <th className="px-4 py-3 font-medium">N° Pièce</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Libellé</th>
                            <th className="px-4 py-3 font-medium">Journal</th>
                            <th className="px-4 py-3 font-medium text-right">Montant</th>
                            <th className="px-4 py-3 font-medium">Imputations</th>
                            <th className="px-4 py-3 font-medium">Origine</th>
                            <th className="px-4 py-3 font-medium">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                    Aucune écriture affichée. Créez une saisie manuelle ou importez
                                    depuis la comptabilité générale (validation).
                                </td>
                            </tr>
                        ) : (
                            filtered.map((e) => {
                                const journal = getJournalAnalytiqueById(e.journalId);
                                const nature = NATURES_CHARGE.find((n) => n.id === e.natureChargeId);
                                const centre = mockCentres.find((c) => c.id === e.centreDestinationId);
                                const exercice = mockExercicesCG.find((x) => x.id === e.exerciceAnalytiqueId);
                                return (
                                    <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">{e.numeroPiece}</td>
                                        <td className="px-4 py-3">{e.dateEffet}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{e.libelleOperation}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {nature?.code} → {centre?.libelle}
                                                {exercice ? ` · ${exercice.libelle}` : ""}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{journal?.code ?? e.journalId}</td>
                                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(e.montant)}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {e.lignes?.length > 1 ? (
                                                <div className="space-y-0.5">
                                                    {e.lignes.map((l, i) => (
                                                        <p key={i} className="font-mono text-[10px]">
                                                            {formatMontantSigne(l.montant)}
                                                        </p>
                                                    ))}
                                                </div>
                                            ) : (
                                                formatMontantSigne(e.montant)
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {e.origine === "IMPORT_CG" ? "Import comptabilité générale" : "Manuelle"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                    STATUT_STYLE[e.statut],
                                                )}
                                            >
                                                {e.statut}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
