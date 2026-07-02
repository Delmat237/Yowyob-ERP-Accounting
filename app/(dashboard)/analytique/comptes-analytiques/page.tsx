"use client";

import { useState, useMemo } from "react";
import {
    mockComptesAnalytiques,
    CompteAnalytique,
    TYPE_SECTION_LABELS,
} from "@/lib/analytique/mock-data";
import {
    CLASSES_ANALYTIQUES,
    CLASSE_ANALYTIQUE_UI,
    type ClasseAnalytique,
    emptyComptesParClasse,
} from "@/lib/analytique/classes-analytiques";
import {
    Plus, Pencil, Trash2, Search, BookOpen,
    CheckCircle2, XCircle, ChevronDown, ChevronRight, Filter,
} from "lucide-react";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";
import { CompteAnalytiqueForm } from "@/components/analytique/compte-analytique-form-modal";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";

// ─── Config classes OHADA ──────────────────────────────────────────────────────
const CLASSE_CONFIG = Object.fromEntries(
    CLASSES_ANALYTIQUES.map((cl) => [
        cl,
        { ...CLASSE_ANALYTIQUE_UI[cl], prefix: cl },
    ]),
) as Record<ClasseAnalytique, (typeof CLASSE_ANALYTIQUE_UI)[ClasseAnalytique] & { prefix: string }>;

const CLASSES = CLASSES_ANALYTIQUES;

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ComptesAnalytiquesPage() {
    const [comptes, setComptes] = useState<CompteAnalytique[]>(mockComptesAnalytiques);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [classeFilter, setClasseFilter] = useState<ClasseAnalytique | "all">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "actif" | "inactif">("all");
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const { openForm, closeForm } = useAnalytiqueCompose();

    // Compte filtrés
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return comptes.filter((c) => {
            const matchSearch = c.numero.includes(q) || c.libelle.toLowerCase().includes(q);
            const matchClasse = classeFilter === "all" || c.classe === classeFilter;
            const matchStatus = statusFilter === "all" || (statusFilter === "actif" ? c.actif : !c.actif);
            return matchSearch && matchClasse && matchStatus;
        });
    }, [comptes, search, classeFilter, statusFilter]);

    // Grouper par classe
    const grouped = useMemo(() => {
        return CLASSES.reduce<Record<ClasseAnalytique, CompteAnalytique[]>>((acc, cl) => {
            acc[cl] = filtered.filter((c) => c.classe === cl);
            return acc;
        }, emptyComptesParClasse<CompteAnalytique>());
    }, [filtered]);

    function handleSave(data: Partial<CompteAnalytique>) {
        const payload = {
            ...data,
            numero: data.numero!.trim(),
            libelle: data.libelle!.trim(),
            classe: data.classe!,
            actif: data.actif ?? true,
        } as CompteAnalytique;

        setComptes((p) =>
            payload.id && p.find((c) => c.id === payload.id)
                ? p.map((c) => (c.id === payload.id ? { ...c, ...payload } : c))
                : [...p, { ...payload, id: payload.id ?? `ca-${Date.now()}` }],
        );
    }

    function openCompteForm(initial?: Partial<CompteAnalytique>) {
        openForm(
            initial?.id ? "Modifier le compte analytique" : "Nouveau compte analytique",
            <CompteAnalytiqueForm
                initial={initial}
                onCancel={closeForm}
                onSubmit={(data) => {
                    handleSave(data);
                    closeForm();
                }}
            />,
        );
    }

    function handleDelete(id: string) {
        setComptes((p) => p.filter((c) => c.id !== id));
        setDeleteId(null);
    }

    function toggleCollapse(cl: ClasseAnalytique) {
        setCollapsed((p) => ({ ...p, [cl]: !p[cl] }));
    }

    const stats = {
        total: comptes.length,
        actifs: comptes.filter((c) => c.actif).length,
        parClasse: CLASSES.map((cl) => ({ cl, count: comptes.filter((c) => c.classe === cl).length })),
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal de Suppression */}
            {deleteId && (
                <ConfirmDialog
                    title="Supprimer le compte"
                    onClose={() => setDeleteId(null)}
                    onConfirm={() => handleDelete(deleteId)}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-destructive/10 rounded-xl flex-shrink-0">
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {comptes.find((c) => c.id === deleteId)?.numero} — {comptes.find((c) => c.id === deleteId)?.libelle}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Cette action est irréversible. Assurez-vous qu&apos;aucun centre d&apos;analyse n&apos;est rattaché à ce compte.
                    </p>
                </ConfirmDialog>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        Comptes Analytiques
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Plan Analytique Classe 9 — Structure OHADA (90 à 99)
                    </p>
                </div>
                <button
                    onClick={() => openCompteForm()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex-shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau compte
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="col-span-2 md:col-span-1 lg:col-span-2 bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold text-primary">{stats.total}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Comptes</span>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-1">
                        <span className="text-[10px] font-medium text-emerald-600"><strong className="text-lg">{stats.actifs}</strong> Actifs</span>
                        <span className="text-[10px] font-medium text-rose-500"><strong className="text-sm">{stats.total - stats.actifs}</strong> Inactifs</span>
                    </div>
                </div>
                {stats.parClasse.map(({ cl, count }) => {
                    const c = CLASSE_CONFIG[cl];
                    return (
                        <div key={cl} className={`bg-card rounded-xl border p-4 shadow-sm text-center cursor-pointer transition-all hover:scale-[1.02] ${c.bg}`}
                            onClick={() => setClasseFilter(classeFilter === cl ? "all" : cl)}>
                            <p className={`text-2xl font-bold ${c.color}`}>{count}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${c.color}`}>{c.label}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{c.full.split(" ").slice(0, 2).join(" ")}…</p>
                        </div>
                    );
                })}
            </div>

            {/* Filtres */}
            <div className="bg-card rounded-2xl border border-border p-3 flex flex-wrap items-center gap-3 shadow-sm">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Chercher par n° ou libellé…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="h-7 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                    <button onClick={() => setClasseFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${classeFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
                        Toutes
                    </button>
                    {CLASSES.map((cl) => (
                        <button key={cl} onClick={() => setClasseFilter(classeFilter === cl ? "all" : cl)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${classeFilter === cl ? `${CLASSE_CONFIG[cl].badge} ring-1 ring-current` : "text-muted-foreground hover:bg-secondary"}`}>
                            {cl}
                        </button>
                    ))}
                </div>
                <div className="h-7 w-px bg-border hidden sm:block" />
                <div className="flex gap-1">
                    {(["all", "actif", "inactif"] as const).map((f) => (
                        <button key={f} onClick={() => setStatusFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${statusFilter === f ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                            {f === "all" ? "Tous statuts" : f === "actif" ? "Actifs" : "Inactifs"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste groupée par classe */}
            <div className="space-y-4">
                {CLASSES.map((cl) => {
                    const list = grouped[cl];
                    const cfg = CLASSE_CONFIG[cl];
                    const isCollapsed = collapsed[cl];

                    return (
                        <div key={cl} className={`rounded-2xl border overflow-hidden shadow-sm ${list.length === 0 ? "opacity-40" : ""}`}>
                            {/* Header groupe */}
                            <button
                                onClick={() => toggleCollapse(cl)}
                                className={`w-full flex items-center justify-between px-5 py-4 ${cfg.bg} hover:opacity-90 transition-opacity`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.badge}`}>{cfg.label}</span>
                                    <div className="text-left">
                                        <p className={`text-sm font-bold ${cfg.color}`}>{cfg.full}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{list.length} compte{list.length > 1 ? "s" : ""}</span>
                                    {isCollapsed ? <ChevronRight className={`h-4 w-4 ${cfg.color}`} /> : <ChevronDown className={`h-4 w-4 ${cfg.color}`} />}
                                </div>
                            </button>

                            {/* Liste comptes */}
                            {!isCollapsed && (
                                <div className="bg-card divide-y divide-border/40">
                                    {list.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-muted-foreground">
                                            <p className="font-medium">Aucun compte dans cette classe</p>
                                            <button
                                                onClick={() => openCompteForm({ classe: cl })}
                                                className={`mt-2 text-xs font-bold ${cfg.color} hover:underline`}
                                            >
                                                + Créer le premier compte {cfg.label}
                                            </button>
                                        </div>
                                    ) : (
                                        list.map((c) => (
                                            <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors group">
                                                {/* Numéro */}
                                                <div className={`font-mono font-bold text-sm px-2.5 py-1 rounded-lg border ${cfg.badge} flex-shrink-0`}>
                                                    {c.numero}
                                                </div>

                                                {/* Infos */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-foreground truncate">{c.libelle}</p>
                                                        {c.actif ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                                        ) : (
                                                            <XCircle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                        {c.numero.startsWith("92") && c.typeSection && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                {TYPE_SECTION_LABELS[c.typeSection]}
                                                            </span>
                                                        )}
                                                        {c.numero.startsWith("90") && c.compteCGMiroir && (
                                                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                CG {c.compteCGMiroir}
                                                            </span>
                                                        )}
                                                        {c.description && (
                                                            <p className="text-[11px] text-muted-foreground truncate">{c.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openCompteForm(c)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(c.id)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Bouton ajouter rapide */}
                                    {list.length > 0 && (
                                        <div className="px-5 py-3 bg-muted/20">
                                            <button
                                                onClick={() => openCompteForm({ classe: cl })}
                                                className={`flex items-center gap-1.5 text-[11px] font-bold ${cfg.color} hover:opacity-70 transition-opacity`}
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Ajouter un compte {cfg.label}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
