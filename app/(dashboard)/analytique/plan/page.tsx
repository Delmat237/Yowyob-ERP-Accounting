"use client";

import { useState, useMemo } from "react";
import {
    mockComptesAnalytiques, mockPlansAnalytiques,
    CompteAnalytique, PlanAnalytique
} from "@/lib/analytique/mock-data";
import {
    CLASSES_ANALYTIQUES,
    CLASSE_ANALYTIQUE_LABELS,
    CLASSE_ANALYTIQUE_UI,
    type ClasseAnalytique,
    emptyComptesParClasse,
} from "@/lib/analytique/classes-analytiques";
import {
    Plus, Search, Pencil, Trash2, Library, BookOpen,
    Hash, AlertTriangle, Archive, CheckCircle2, ChevronRight, ChevronDown
} from "lucide-react";
import { PlanCompteAnalytiqueForm } from "@/components/analytique/plan-compte-analytique-form";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";

const CLASS_CONFIG = Object.fromEntries(
    CLASSES_ANALYTIQUES.map((cl) => [
        cl,
        {
            label: CLASSE_ANALYTIQUE_LABELS[cl].replace(/^Classe \d+ — /, `${cl} — `),
            desc: CLASSE_ANALYTIQUE_UI[cl].full,
            color: `${CLASSE_ANALYTIQUE_UI[cl].color} ${CLASSE_ANALYTIQUE_UI[cl].bg.split(" ")[0]}`,
            border: CLASSE_ANALYTIQUE_UI[cl].border,
        },
    ]),
) as Record<ClasseAnalytique, { label: string; desc: string; color: string; border: string }>;

// ─── Component Plan Card ──────────────────────────────────────────────────────
function PlanCard({ plan }: { plan: PlanAnalytique }) {
    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${plan.statut === "ACTIF"
            ? "bg-card border-primary/30 ring-1 ring-primary/20"
            : "bg-muted/20 border-border opacity-70"}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${plan.statut === "ACTIF" ? "bg-primary/10" : "bg-muted"}`}>
                        <Library className={`h-5 w-5 ${plan.statut === "ACTIF" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">Exercice : {plan.libelle}</p>
                            {plan.statut === "ACTIF"
                                ? <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold"><CheckCircle2 className="h-3 w-3" /> Actif</span>
                                : <span className="flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-full text-[10px] font-bold"><Archive className="h-3 w-3" /> Archivé</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">La nomenclature ci-dessous définit tous les comptes analytiques pour cet exercice.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlanAnalytiquePage() {
    const [comptes, setComptes] = useState<CompteAnalytique[]>(mockComptesAnalytiques);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { openForm, closeForm } = useAnalytiqueCompose();

    // Grouping par classe
    const groupedComptes = useMemo(() => {
        const result = emptyComptesParClasse<CompteAnalytique>();
        const filtered = search
            ? comptes.filter((c) => c.numero.includes(search) || c.libelle.toLowerCase().includes(search.toLowerCase()))
            : comptes;

        filtered.forEach(c => { if (result[c.classe]) result[c.classe].push(c); });

        // Trier par numéro
        Object.keys(result).forEach(k => {
            result[k as ClasseAnalytique].sort((a, b) => a.numero.localeCompare(b.numero));
        });
        return result;
    }, [comptes, search]);

    const handleSave = (data: Partial<CompteAnalytique>) => {
        if (data.id) {
            setComptes(p => p.map(c => c.id === data.id ? { ...c, ...data } as CompteAnalytique : c));
        } else {
            setComptes(p => [...p, { ...data, id: `c-${Date.now()}` } as CompteAnalytique]);
        }
    };

    const openCompteForm = (initial?: Partial<CompteAnalytique>) => {
        openForm(
            initial?.id ? "Modifier le compte du plan" : "Nouveau compte du plan analytique",
            <PlanCompteAnalytiqueForm
                initial={initial}
                onCancel={closeForm}
                onSubmit={(data) => {
                    handleSave(data);
                    closeForm();
                }}
            />,
        );
    };

    const compteToDelete = comptes.find(c => c.id === deleteId);
    const planActif = mockPlansAnalytiques.find(p => p.statut === "ACTIF");

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Confirm delete */}
            {deleteId && (
                <ConfirmDialog
                    title="Supprimer le compte ?"
                    onClose={() => setDeleteId(null)}
                    onConfirm={() => { setComptes((p) => p.filter((c) => c.id !== deleteId)); }}
                >
                    <p className="text-sm text-muted-foreground">
                        Voulez-vous supprimer le compte <strong>{compteToDelete?.numero} - {compteToDelete?.libelle}</strong> ? Cette action est irréversible.
                    </p>
                </ConfirmDialog>
            )}

            {/* Header + Plan Info */}
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Plan Comptable Analytique (Classe 9)</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Nomenclature décimale conforme OHADA liant comptabilité générale et analytique.
                    </p>
                </div>
                {planActif && <PlanCard plan={planActif} />}
            </div>

            {/* Barre d'outil Nomenclature */}
            <div className="flex items-center justify-between mt-8 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-input focus:ring-2 focus:ring-ring outline-none font-mono placeholder:font-sans"
                        placeholder="Rechercher par compte ou intitulé…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => openCompteForm()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" /> Nouveau compte 
                </button>
            </div>

            {/* List par classe */}
            <div className="space-y-6">
                {CLASSES_ANALYTIQUES.map((classe) => {
                    const cfg = CLASS_CONFIG[classe];
                    const list = groupedComptes[classe];

                    if (list.length === 0 && search) return null; // Ne pas afficher si recherche vide

                    return (
                        <div key={classe} className={`rounded-2xl border bg-card overflow-hidden shadow-sm ${cfg.border}`}>
                            <div className={`px-5 py-4 border-b flex items-center justify-between ${cfg.border} bg-card`}>
                                <div>
                                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                        <BookOpen className={`h-4 w-4 ${cfg.color.split(" ")[0]}`} />
                                        {cfg.label}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-1">{cfg.desc}</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-muted text-muted-foreground">
                                    {list.length} compte(s)
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="px-5 py-3 text-left w-32">N° Compte</th>
                                            <th className="px-5 py-3 text-left">Intitulé / Description</th>
                                            <th className="px-5 py-3 text-center w-24">Statut</th>
                                            <th className="px-5 py-3 text-right w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-foreground">
                                        {list.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm italic">
                                                    Aucun compte défini dans cette classe.
                                                </td>
                                            </tr>
                                        ) : (
                                            list.map((c) => (
                                                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3 font-mono font-bold">{c.numero}</td>
                                                    <td className="px-5 py-3">
                                                        <p className="font-semibold">{c.libelle}</p>
                                                        {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border'}`}>
                                                            {c.actif ? "Actif" : "Inactif"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => openCompteForm(c)} className="p-1.5 rounded-lg hover:text-primary hover:bg-primary/10 text-muted-foreground transition-colors"><Pencil className="h-4 w-4" /></button>
                                                            <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:text-destructive hover:bg-destructive/10 text-muted-foreground transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Note explicative (User feedback integration) */}
            <div className="bg-muted/20 border border-border p-5 rounded-2xl flex gap-4 text-sm mt-8">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="space-y-2 text-muted-foreground leading-relaxed">
                    <p className="font-bold text-foreground">Comprendre la logique décimale OHADA et le passage en Analytique</p>
                    <p>Le Plan Analytique remplace la simple "liste d'axes". Il s'agit de la véritable <strong>nomenclature comptable</strong> servant de destination ou de pont aux charges financières (Classe 6).</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Les comptes de <strong className="text-foreground">Classe 6</strong> (ex: 606100 Électricité) de la Comptabilité Générale sont "reflétés" dans la <strong className="text-foreground">Classe 90</strong> (ex: 906061).</li>
                        <li>Cette opération miroir équilibre la balance analytique et permet d'imputer la charge finale dans un compte de section <strong className="text-foreground">Classe 92</strong> (ex: 923100 Atelier Produc.).</li>
                    </ul>
                    <p>Le module "Incorporations" permet de paramétrer ces relations (60x → 90x → 92x).</p>
                </div>
            </div>

        </div>
    );
}
