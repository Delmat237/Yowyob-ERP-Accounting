"use client";

import { useState, useMemo } from "react";
import {
    mockComptesAnalytiques,
    CompteAnalytique,
    ClasseAnalytique,
} from "@/lib/mock-data";
import {
    Plus, Pencil, Trash2, X, Search, BookOpen,
    CheckCircle2, XCircle, ChevronDown, ChevronRight, Filter,
} from "lucide-react";
import { FloatingModal } from "@/components/ui/floating-modal";

// ─── Config classes OHADA ──────────────────────────────────────────────────────
const CLASSE_CONFIG: Record<ClasseAnalytique, {
    label: string;
    full: string;
    color: string;
    bg: string;
    badge: string;
    prefix: string;
}> = {
    "90": {
        label: "Classe 90",
        full: "Comptes de Réfléchissement",
        color: "text-indigo-700",
        bg: "bg-indigo-50/60 border-indigo-200",
        badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
        prefix: "9",
    },
    "92": {
        label: "Classe 92",
        full: "Comptes de Sections / Centres d'Analyse",
        color: "text-emerald-700",
        bg: "bg-emerald-50/60 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        prefix: "92",
    },
    "94": {
        label: "Classe 94",
        full: "Comptes d'Inventaire Permanent",
        color: "text-amber-700",
        bg: "bg-amber-50/60 border-amber-200",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        prefix: "94",
    },
    "97": {
        label: "Classe 97",
        full: "Comptes de Résultats Analytiques",
        color: "text-rose-700",
        bg: "bg-rose-50/60 border-rose-200",
        badge: "bg-rose-100 text-rose-700 border-rose-200",
        prefix: "97",
    },
};

const CLASSES: ClasseAnalytique[] = ["90", "92", "94", "97"];

// ─── Modal ─────────────────────────────────────────────────────────────────────
function CompteModal({
    initial,
    onClose,
    onSave,
}: {
    initial?: Partial<CompteAnalytique>;
    onClose: () => void;
    onSave: (c: CompteAnalytique) => void;
}) {
    const [form, setForm] = useState<Partial<CompteAnalytique>>({
        classe: "92",
        actif: true,
        description: "",
        dateDebut: "",
        dateFin: "",
        ...initial,
    });

    const isEdit = !!initial?.id;
    const cfg = form.classe ? CLASSE_CONFIG[form.classe] : null;
    const valid = !!form.numero?.trim() && !!form.libelle?.trim() && !!form.classe;

    // Extract bg color class, e.g. "bg-emerald-50/60" -> "bg-emerald-600"
    const accentColorMap: Record<ClasseAnalytique, string> = {
        "90": "bg-indigo-600",
        "92": "bg-emerald-600",
        "94": "bg-amber-600",
        "97": "bg-rose-600",
    };
    const accentColor = form.classe ? accentColorMap[form.classe] : "bg-primary";

    return (
        <FloatingModal
            title={isEdit ? "Modifier le compte" : "Nouveau compte analytique"}
            subtitle="Plan Analytique — Classe 9 OHADA"
            icon={<BookOpen className="h-4 w-4" />}
            onClose={onClose}
            accentColor={accentColor}
            footer={
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        disabled={!valid}
                        onClick={() => {
                            onSave({
                                id: form.id ?? `ca-${Date.now()}`,
                                numero: form.numero!.trim(),
                                libelle: form.libelle!.trim(),
                                classe: form.classe!,
                                actif: form.actif ?? true,
                                description: form.description,
                                dateDebut: form.dateDebut || undefined,
                                dateFin: form.dateFin || undefined,
                            });
                            onClose();
                        }}
                        className="px-6 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                    >
                        {isEdit ? "Enregistrer les modifications" : "Créer le compte"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-5">
                {/* Classe */}
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                        Classe OHADA *
                    </label>
                    <div className={`grid gap-2 ${initial && !initial.id && initial.classe ? "grid-cols-1" : "grid-cols-2"}`}>
                        {(initial && !initial.id && initial.classe ? [initial.classe as ClasseAnalytique] : CLASSES).map((cl) => {
                            const c = CLASSE_CONFIG[cl];
                            const selected = form.classe === cl;
                            return (
                                <button
                                    key={cl}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, classe: cl }))}
                                    className={`text-left p-3 rounded-xl border transition-all ${selected
                                        ? "ring-2 ring-primary/30 border-primary bg-primary/5 shadow-sm"
                                        : "border-border hover:bg-secondary"
                                        }`}
                                >
                                    <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.badge}`}
                                    >
                                        {c.label}
                                    </span>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                        {c.full}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Numéro & Libellé */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                            N° de Compte *
                        </label>
                        <input
                            type="text"
                            className="w-full font-mono text-sm border border-border rounded-xl px-3 py-2.5 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder={cfg ? `${cfg.prefix}xxxx` : "9xxxxx"}
                            value={form.numero ?? ""}
                            onChange={(e) => setForm({ ...form, numero: e.target.value })}
                        />
                        {cfg && (
                            <p className="text-[10px] text-muted-foreground mt-1 italic">
                                Doit commencer par {cfg.prefix}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                            Statut
                        </label>
                        <div className="flex gap-2 h-[42px] items-center">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, actif: true })}
                                className={`flex-1 text-center px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${form.actif
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "text-muted-foreground border-border hover:bg-secondary"
                                    }`}
                            >
                                Actif
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, actif: false })}
                                className={`flex-1 text-center px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${!form.actif
                                    ? "bg-rose-50 text-rose-700 border-rose-300"
                                    : "text-muted-foreground border-border hover:bg-secondary"
                                    }`}
                            >
                                Inactif
                            </button>
                        </div>
                    </div>
                </div>

                {/* Libellé */}
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Libellé *
                    </label>
                    <input
                        type="text"
                        className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Ex: Section Atelier de Production"
                        value={form.libelle ?? ""}
                        onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Description / Observations
                    </label>
                    <textarea
                        className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-input h-20 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Détails, usage, compte CG miroir associé..."
                        value={form.description ?? ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </div>

                {/* Dates de validité */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                            Date Début
                        </label>
                        <input
                            type="date"
                            className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                            value={form.dateDebut ?? ""}
                            onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                            Date Fin (Optionnel)
                        </label>
                        <input
                            type="date"
                            className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                            value={form.dateFin ?? ""}
                            onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </FloatingModal>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ComptesAnalytiquesPage() {
    const [comptes, setComptes] = useState<CompteAnalytique[]>(mockComptesAnalytiques);
    const [modal, setModal] = useState<{ open: boolean; initial?: Partial<CompteAnalytique> }>({ open: false });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [classeFilter, setClasseFilter] = useState<ClasseAnalytique | "all">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "actif" | "inactif">("all");
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
        }, {} as Record<ClasseAnalytique, CompteAnalytique[]>);
    }, [filtered]);

    function handleSave(data: CompteAnalytique) {
        setComptes((p) =>
            p.find((c) => c.id === data.id)
                ? p.map((c) => (c.id === data.id ? data : c))
                : [...p, data]
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
            {/* Modal Création / Édition */}
            {modal.open && (
                <CompteModal
                    initial={modal.initial}
                    onClose={() => setModal({ open: false })}
                    onSave={handleSave}
                />
            )}

            {/* Modal de Suppression */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-destructive/10 rounded-xl flex-shrink-0">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground text-sm">Supprimer le compte</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {comptes.find((c) => c.id === deleteId)?.numero} — {comptes.find((c) => c.id === deleteId)?.libelle}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-5">
                            Cette action est irréversible. Assurez-vous qu&apos;aucun centre d&apos;analyse n&apos;est rattaché à ce compte.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary transition-colors font-medium text-muted-foreground">
                                Annuler
                            </button>
                            <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold transition-all active:scale-95">
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        Comptes Analytiques
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Plan Analytique Classe 9 — Structure OHADA (90, 92, 94, 97)
                    </p>
                </div>
                <button
                    onClick={() => setModal({ open: true })}
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
                                                onClick={() => setModal({ open: true, initial: { classe: cl } })}
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
                                                    {c.description && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{c.description}</p>
                                                    )}
                                                </div>

                                                {/* Dates */}
                                                {(c.dateDebut || c.dateFin) && (
                                                    <div className="hidden lg:flex flex-col items-end text-[10px] text-muted-foreground flex-shrink-0">
                                                        {c.dateDebut && <span>Du {c.dateDebut}</span>}
                                                        {c.dateFin && <span>Au {c.dateFin}</span>}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setModal({ open: true, initial: c })}
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
                                                onClick={() => setModal({ open: true, initial: { classe: cl } })}
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
