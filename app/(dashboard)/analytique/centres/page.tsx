"use client";

import { useState } from "react";
import { mockCentres, CentreAnalyse } from "@/lib/analytique/mock-data";
import { Plus, Search, ArrowRight } from "lucide-react";
import { CentresAnalyseList } from "@/components/analytique/centres-analyse-list";
import { CentreAnalytiqueForm } from "@/components/analytique/centre-form-modal";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";
import { useOfflineMockList } from "@/hooks/use-offline-mock-list";
import { useOfflineMockMutations } from "@/hooks/use-offline-mock-mutations";
import { CA_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { OfflineCacheBanner } from "@/components/offline/offline-cache-banner";

export default function CentresAnalysePage() {
    const listHook = useOfflineMockList(CA_CACHE_KEYS.CENTRES, mockCentres);
    const { data: centres, usingCache, cacheTimestamp } = listHook;
    const { upsertItem, removeItem } = useOfflineMockMutations(
        CA_CACHE_KEYS.CENTRES,
        "ca.centres",
        listHook,
    );
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "principal" | "auxiliaire">("all");
    const { openForm, closeForm } = useAnalytiqueCompose();

    const filtered = centres.filter((c) => {
        const matchSearch = c.libelle.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === "all" ? true :
                filter === "principal" ? c.nature !== "CENTRE_AUXILIAIRE" :
                    c.nature === "CENTRE_AUXILIAIRE";
        return matchSearch && matchFilter;
    });

    const principaux = centres.filter((c) => c.nature !== "CENTRE_AUXILIAIRE");
    const auxiliaires = centres.filter((c) => c.nature === "CENTRE_AUXILIAIRE");

    const handleSave = async (data: Partial<CentreAnalyse>) => {
        await upsertItem(data, {
            code: "",
            libelle: "",
            nature: "CENTRE_PRINCIPAL",
            uniteOeuvre: "",
            axeId: "",
            actif: true,
        });
    };

    const openCentreForm = (initial?: Partial<CentreAnalyse>) => {
        openForm(
            initial?.id ? "Modifier le centre d'analyse" : "Nouveau centre d'analyse",
            <CentreAnalytiqueForm
                initial={initial}
                onCancel={closeForm}
                onSubmit={async (data) => {
                    await handleSave(data);
                    closeForm();
                }}
            />,
        );
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />
            {deleteId && (
                <ConfirmDialog
                    title="Confirmer la suppression"
                    onClose={() => setDeleteId(null)}
                    onConfirm={() => void removeItem(deleteId!)}
                >
                    <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
                </ConfirmDialog>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Centres d&apos;Analyse</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Modélisation des centres de coûts et de responsabilité (BF-02)</p>
                </div>
                <button onClick={() => openCentreForm()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm transition-all">
                    <Plus className="h-4 w-4" /> Nouveau centre
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total centres", val: centres.length, color: "text-primary" },
                    { label: "Principaux", val: principaux.length, color: "text-indigo-600" },
                    { label: "Auxiliaires", val: auxiliaires.length, color: "text-cyan-600" },
                    { label: "Actifs", val: centres.filter((c) => c.actif).length, color: "text-emerald-600" },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-sm">
                        <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider text-[10px]">Flux de cession</h3>
                <div className="flex items-center gap-4 flex-wrap">
                    {auxiliaires.map((aux) => (
                        <div key={aux.id} className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg text-[10px] font-bold uppercase">{aux.code}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            {principaux.slice(0, 2).map((p, i) => (
                                <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold uppercase">{p.code}</span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input focus:ring-2 focus:ring-ring outline-none" placeholder="Rechercher..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
                </div>
                <div className="flex border border-border rounded-xl overflow-hidden bg-muted/20">
                    {(["all", "principal", "auxiliaire"] as const).map((f) => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 text-[11px] font-bold uppercase transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                            {f === "all" ? "Tous" : f === "principal" ? "Principaux" : "Auxiliaires"}
                        </button>
                    ))}
                </div>
            </div>

            <CentresAnalyseList
                centres={filtered}
                onEdit={(c) => openCentreForm(c)}
                onDelete={(id) => setDeleteId(id)}
            />
        </div>
    );
}
