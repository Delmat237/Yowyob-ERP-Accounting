"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Notebook, Search } from "lucide-react";
import { toast } from "sonner";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import {
    TYPE_JOURNAL_LABELS,
    type JournalAnalytiqueConfig,
} from "@/lib/analytique/journal-analytique";
import {
    createJournalAnalytique,
    listJournauxAnalytiques,
    saveJournalAnalytique,
} from "@/lib/analytique/journaux-analytiques-store";
import { JournalAnalytiqueForm } from "@/components/analytique/journal-analytique-form";
import { cn } from "@/lib/utils";

export default function JournauxAnalytiquesPage() {
    const [journaux, setJournaux] = useState<JournalAnalytiqueConfig[]>([]);
    const [search, setSearch] = useState("");
    const { openForm, closeForm } = useAnalytiqueCompose();

    const reload = useCallback((options?: AutoRefreshOptions) => {
        setJournaux(listJournauxAnalytiques());
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    useAutoRefresh(reload, [reload]);

    const filtered = journaux.filter(
        (j) =>
            j.libelle.toLowerCase().includes(search.toLowerCase()) ||
            j.code.toLowerCase().includes(search.toLowerCase()),
    );

    const openCreate = () => {
        openForm(
            "Nouveau journal analytique",
            <JournalAnalytiqueForm
                onCancel={closeForm}
                onSubmit={(data) => {
                    createJournalAnalytique(data);
                    closeForm();
                    reload();
                    toast.success("Journal analytique créé");
                }}
            />,
        );
    };

    const openEdit = (journal: JournalAnalytiqueConfig) => {
        openForm(
            "Modifier le journal",
            <JournalAnalytiqueForm
                initial={journal}
                onCancel={closeForm}
                onSubmit={(data) => {
                    saveJournalAnalytique(data);
                    closeForm();
                    reload();
                    toast.success("Journal mis à jour");
                }}
            />,
        );
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Notebook className="h-7 w-7 text-primary" />
                        Journaux analytiques
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Registres de saisie analytique — type, centre source et compte de reflet
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" /> Nouveau journal
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-card"
                    placeholder="Rechercher un journal…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((j) => (
                    <button
                        key={j.id}
                        type="button"
                        onClick={() => openEdit(j)}
                        className="text-left bg-card rounded-2xl border border-border p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <p className="font-semibold text-foreground">{j.libelle}</p>
                                <p className="text-xs font-mono text-muted-foreground">{j.code}</p>
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    j.actif ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                                )}
                            >
                                {j.actif ? "Actif" : "Inactif"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{TYPE_JOURNAL_LABELS[j.type]}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Centre source :{" "}
                            <span className="font-medium text-foreground">
                                {j.exigenceCentreSource === "OBLIGATOIRE"
                                    ? "Obligatoire"
                                    : j.exigenceCentreSource === "OPTIONNELLE"
                                      ? "Optionnelle"
                                      : "Désactivée"}
                            </span>
                            {j.compteRefletDefaut && (
                                <> · Reflet {j.compteRefletDefaut}</>
                            )}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
