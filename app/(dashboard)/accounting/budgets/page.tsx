"use client";

/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BudgetListView, BudgetItem, BudgetStatut, BudgetType } from '@/components/accounting/budget-list-view';
import { useCompose } from '@/hooks/use-compose-store';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    List, X, Pencil, CheckCircle, ToggleLeft, ToggleRight,
    AlertTriangle, ChevronRight, ChevronDown,
    Building2, Calendar, Layers, Save, Plus, Trash2, PlusCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { hasPermission } from '@/src/lib/auth/roles';
import { AxeAnalytique } from '@/components/accounting/analytics-list-view';
import { cn } from '@/lib/utils';
import { ExerciceComptableDto } from '@/src/lib2/models/ExerciceComptableDto';
import { PeriodeComptableDto } from '@/src/lib2/models/PeriodeComptableDto';
import { AccountingFiscalYearsService } from '@/src/lib2/services/AccountingFiscalYearsService';
import { AccountingPeriodsService } from '@/src/lib2/services/AccountingPeriodsService';
import { AccountingAnalyticsService } from '@/src/lib2/services/AccountingAnalyticsService';
import { AccountingBudgetsService } from '@/src/lib2/services/AccountingBudgetsService';
import { BudgetDto } from '@/src/lib2/models/BudgetDto';
import { AxeAnalytiqueDto } from '@/src/lib2/models/AxeAnalytiqueDto';
import { mapBudgetDtoToItem } from '@/lib/accounting/budget-mappers';
import { mockCentres, mockAxes } from '@/lib/analytique/mock-data';
import type { CentreAnalyse } from '@/lib/analytique/mock-data';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
import type { CompteDto } from '@/src/lib2/models/CompteDto';


const statutColors: Record<BudgetStatut, string> = {
    BROUILLON: 'bg-yellow-100 text-yellow-800',
    VALIDE: 'bg-blue-100 text-blue-800',
    ACTIF: 'bg-green-100 text-green-800',
    INACTIF: 'bg-gray-100 text-gray-600',
    CLOTURE: 'bg-slate-100 text-slate-600',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildBudgetCode(type: string) {
    return `${type.substring(0, 3)}-${Date.now().toString().slice(-6)}`.toUpperCase();
}

function mapAxeDto(dto: AxeAnalytiqueDto): AxeAnalytique {
    const compteIds = dto.compteIds ?? [];
    const compteLibelles = dto.compteLibelles ?? [];

    return {
        id: dto.id ?? '',
        code: dto.code ?? '',
        libelle: dto.libelle ?? '',
        type: (dto.type ?? 'PROJET') as AxeAnalytique['type'],
        responsable: dto.responsable ?? '',
        actif: dto.actif ?? true,
        comptes: compteIds.map((id, index) => ({
            id,
            libelle: compteLibelles[index] ?? id,
        })),
    };
}

/** Résout l'axe analytique lié à un centre (id API ou correspondance par code). */
function resolveAxeIdForCentre(centre: CentreAnalyse, activeAxes: AxeAnalytique[]): string | null {
    const byId = activeAxes.find(a => a.id === centre.axeId);
    if (byId) return byId.id;

    const mockAxe = mockAxes.find(a => a.id === centre.axeId);
    if (mockAxe) {
        const byCode = activeAxes.find(a => a.code === mockAxe.code);
        if (byCode) return byCode.id;
    }

    return null;
}

function mapBudgetDto(dto: BudgetDto): BudgetItem {
    return mapBudgetDtoToItem(dto);
}

interface BudgetFormData {
    type: BudgetType;
    nom: string;
    montant: number;
    parentId: string;
    dateDebut: string;
    dateFin: string;
    seuilAlerte: number;
    axeIds: string[];
    centreIds: string[];
    axes: AxeAnalytique[];
    compteLines: BudgetCompteLine[];
    exerciceComptableId?: string;
    periodeComptableId?: string;
}

function toBudgetDto(data: BudgetFormData, parentBudget?: BudgetItem): BudgetDto | null {
    const compteLines = (data.compteLines ?? [])
        .filter(line => line.compteComptableId && line.montantAlloue > 0)
        .filter(line => UUID_PATTERN.test(line.compteComptableId))
        .map(line => ({
            compteId: line.compteComptableId,
            montantAlloue: line.montantAlloue,
            description: line.description,
        }));

    if (compteLines.length === 0) {
        toast.error('Ajoutez au moins une ligne budgétaire avec un compte et un montant.');
        return null;
    }

    const totalLignes = compteLines.reduce((s, l) => s + (l.montantAlloue ?? 0), 0);
    if (totalLignes <= 0) {
        toast.error('Le montant alloué doit être supérieur à 0 (somme des lignes budgétaires).');
        return null;
    }

    const notes = data.centreIds.length > 0
        ? JSON.stringify({ centreIds: data.centreIds })
        : undefined;

    return {
        code: buildBudgetCode(data.type),
        nom: data.nom,
        type: data.type,
        statut: 'BROUILLON',
        montantAlloue: totalLignes,
        montantConsomme: 0,
        parentId: data.parentId || undefined,
        exerciceId: data.type === 'EXERCICE'
            ? data.exerciceComptableId
            : parentBudget?.exerciceId,
        periodeId: data.type === 'PERIODE'
            ? data.periodeComptableId
            : undefined,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        seuilAlerte: data.seuilAlerte,
        axeIds: data.axeIds.length > 0 ? data.axeIds : undefined,
        compteLines,
        notes,
    };
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProgressBar({ ratio, seuilAlerte }: { ratio: number; seuilAlerte: number }) {
    const color = ratio > 100 ? 'bg-red-500' : ratio >= seuilAlerte ? 'bg-yellow-500' : 'bg-green-500';
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-500">{ratio}% consommé</span>
                {ratio > 100 && <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Dépassement</span>}
                {ratio >= seuilAlerte && ratio <= 100 && <span className="text-yellow-600 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Alerte seuil</span>}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${Math.min(100, ratio)}%` }} />
            </div>
        </div>
    );
}

// ─── Vue Hiérarchique ─────────────────────────────────────────────────────────

interface HierarchyViewProps {
    budgets: BudgetItem[];
    onSelect: (b: BudgetItem) => void;
    selectedId?: string;
}

function HierarchyView({ budgets, onSelect, selectedId }: HierarchyViewProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['ex1']));

    const toggle = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const exercices = budgets.filter(b => b.type === 'EXERCICE');

    return (
        <div className="space-y-4">
            {exercices.map(ex => {
                const periodes = budgets.filter(b => b.type === 'PERIODE' && b.parentId === ex.id);
                const sommePeriodes = periodes.reduce((s, p) => s + p.montantAlloue, 0);
                const depassementPeriodes = sommePeriodes > ex.montantAlloue;
                const isExpanded = expandedIds.has(ex.id);

                return (
                    <div key={ex.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Exercice header */}
                        <div
                            className={cn("flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors",
                                selectedId === ex.id && "bg-blue-50 border-l-4 border-l-blue-500")}
                            onClick={() => onSelect(ex)}
                        >
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggle(ex.id); }}
                                className="text-slate-400 hover:text-slate-700">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            <Building2 className="h-5 w-5 text-indigo-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-slate-800">{ex.nom}</p>
                                    <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">Exercice</Badge>
                                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statutColors[ex.statut])}>{ex.statut}</span>
                                    {depassementPeriodes && (
                                        <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />Périodes dépassent le budget
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{ex.code} • {ex.dateDebut} → {ex.dateFin}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs text-slate-400">Consommé</p>
                                <p className="font-black text-slate-800 font-mono">{(ex.montantConsomme / 1000000).toFixed(1)}M / {(ex.montantAlloue / 1000000).toFixed(1)}M XAF</p>
                                <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1">
                                    <div className={cn("h-1.5 rounded-full", ex.montantConsomme / ex.montantAlloue > 0.9 ? 'bg-red-500' : ex.montantConsomme / ex.montantAlloue >= ex.seuilAlerte / 100 ? 'bg-yellow-500' : 'bg-green-500')}
                                        style={{ width: `${Math.min(100, Math.round(ex.montantConsomme / ex.montantAlloue * 100))}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Périodes */}
                        {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/30">
                                {periodes.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic px-12 py-3">Aucune période définie pour cet exercice.</p>
                                ) : (
                                    periodes.map(per => {
                                        const analytiques = budgets.filter(b => b.type === 'ANALYTIQUE' && b.parentId === per.id);
                                        const sommeAna = analytiques.reduce((s, a) => s + a.montantAlloue, 0);
                                        const depassementAna = sommeAna > per.montantAlloue;
                                        const isPerExpanded = expandedIds.has(per.id);

                                        return (
                                            <div key={per.id} className="border-b border-slate-100 last:border-0">
                                                <div
                                                    className={cn("flex items-center gap-3 px-8 py-3 cursor-pointer hover:bg-white transition-colors",
                                                        selectedId === per.id && "bg-blue-50 border-l-4 border-l-blue-400")}
                                                    onClick={() => onSelect(per)}
                                                >
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); toggle(per.id); }}
                                                        className="text-slate-400 hover:text-slate-700">
                                                        {isPerExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-slate-700">{per.nom}</p>
                                                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Période</Badge>
                                                            <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full text-[10px]", statutColors[per.statut])}>{per.statut}</span>
                                                            {depassementAna && <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Analytiques dépassent</span>}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-mono">{per.code}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 text-xs">
                                                        <p className="font-mono text-slate-600">{(per.montantConsomme / 1000000).toFixed(1)}M / {(per.montantAlloue / 1000000).toFixed(1)}M XAF</p>
                                                        <div className="w-24 h-1 bg-gray-200 rounded-full mt-1">
                                                            <div className={cn("h-1 rounded-full", per.montantConsomme / per.montantAlloue > 0.9 ? 'bg-red-500' : 'bg-blue-400')}
                                                                style={{ width: `${Math.min(100, Math.round(per.montantConsomme / per.montantAlloue * 100))}%` }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Analytiques */}
                                                {isPerExpanded && analytiques.length > 0 && (
                                                    <div className="bg-white border-t border-slate-50">
                                                        {analytiques.map(ana => (
                                                            <div key={ana.id}
                                                                className={cn("flex items-center gap-3 px-16 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                                                                    selectedId === ana.id && "bg-emerald-50 border-l-4 border-l-emerald-400")}
                                                                onClick={() => onSelect(ana)}
                                                            >
                                                                <Layers className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xs font-medium text-slate-700">{ana.nom}</p>
                                                                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statutColors[ana.statut])}>{ana.statut}</span>
                                                                    </div>
                                                                    {ana.axeLibelles && <p className="text-[10px] text-emerald-600">{ana.axeLibelles}</p>}
                                                                </div>
                                                                <div className="text-right shrink-0 text-xs">
                                                                    <p className="font-mono text-slate-500">{(ana.montantConsomme / 1000000).toFixed(1)}M / {(ana.montantAlloue / 1000000).toFixed(1)}M</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}


// ─── Panneau détail ───────────────────────────────────────────────────────────

interface DetailPanelProps {
    budget: BudgetItem;
    allBudgets: BudgetItem[];
    onClose: () => void;
    onValidate: (id: string) => void;
    onActivate: (id: string) => void;
    onDeactivate: (id: string) => void;
    onEdit: (id: string) => void;
    canManage: boolean;
}

function DetailPanel({ budget, allBudgets, onClose, onValidate, onActivate, onDeactivate, onEdit, canManage }: DetailPanelProps) {
    const ratio = budget.montantAlloue > 0 ? Math.round((budget.montantConsomme / budget.montantAlloue) * 100) : 0;
    const disponible = budget.montantAlloue - budget.montantConsomme;

    const children = allBudgets.filter(b => b.parentId === budget.id);

    return (
        <div className="w-full md:w-[460px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{budget.nom}</h3>
                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statutColors[budget.statut])}>{budget.statut}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{budget.code}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-slate-400 shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Infos */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {budget.parentNom && (
                        <div className="col-span-2 space-y-0.5">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Budget parent</p>
                            <p className="text-slate-700">{budget.parentNom}</p>
                        </div>
                    )}
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Période</p>
                        <p className="text-slate-700 text-xs">{budget.dateDebut} → {budget.dateFin}</p>
                    </div>
                    {budget.responsable && (
                        <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Responsable</p>
                            <p className="text-slate-700">{budget.responsable}</p>
                        </div>
                    )}
                    {budget.axeLibelles && (
                        <div className="col-span-2 space-y-0.5">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Axes analytiques</p>
                            <p className="text-emerald-700 text-xs">{budget.axeLibelles}</p>
                        </div>
                    )}
                </div>

                {/* Consommation */}
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-blue-500 uppercase font-bold">Alloué</p>
                            <p className="text-base font-black text-blue-700 font-mono">{(budget.montantAlloue / 1000000).toFixed(1)}M</p>
                            <p className="text-[9px] text-blue-400">XAF</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Consommé</p>
                            <p className={cn("text-base font-black font-mono", ratio > 100 ? 'text-red-600' : 'text-slate-700')}>{(budget.montantConsomme / 1000000).toFixed(1)}M</p>
                            <p className="text-[9px] text-slate-400">XAF</p>
                        </div>
                        <div className={cn("border rounded-lg p-3 text-center", disponible >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100')}>
                            <p className={cn("text-[10px] uppercase font-bold", disponible >= 0 ? 'text-green-500' : 'text-red-500')}>Disponible</p>
                            <p className={cn("text-base font-black font-mono", disponible >= 0 ? 'text-green-700' : 'text-red-700')}>{(Math.abs(disponible) / 1000000).toFixed(1)}M</p>
                            <p className={cn("text-[9px]", disponible >= 0 ? 'text-green-400' : 'text-red-400')}>XAF</p>
                        </div>
                    </div>
                    <ProgressBar ratio={ratio} seuilAlerte={budget.seuilAlerte} />
                </div>

                {/* Enfants (périodes ou analytiques) */}
                {children.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            {budget.type === 'EXERCICE' ? 'Périodes rattachées' : 'Budgets analytiques'}
                        </p>
                        {children.map(child => {
                            const childRatio = child.montantAlloue > 0 ? Math.round((child.montantConsomme / child.montantAlloue) * 100) : 0;
                            return (
                                <div key={child.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-slate-700">{child.nom}</p>
                                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statutColors[child.statut])}>{child.statut}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                        <span>{child.montantConsomme.toLocaleString('fr-FR')} consommé</span>
                                        <span>{child.montantAlloue.toLocaleString('fr-FR')} alloué</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-200 rounded-full">
                                        <div className={cn("h-1 rounded-full", childRatio > 100 ? 'bg-red-500' : childRatio >= child.seuilAlerte ? 'bg-yellow-500' : 'bg-green-500')}
                                            style={{ width: `${Math.min(100, childRatio)}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {/* Alerte dépassement */}
                        {(() => {
                            const somme = children.reduce((s, c) => s + c.montantAlloue, 0);
                            if (somme > budget.montantAlloue) {
                                return (
                                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        La somme des budgets enfants ({somme.toLocaleString('fr-FR')} XAF) dépasse le budget alloué ({budget.montantAlloue.toLocaleString('fr-FR')} XAF).
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
                {canManage && budget.statut === 'BROUILLON' && (
                    <Button onClick={() => onValidate(budget.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9">
                        <CheckCircle className="h-4 w-4" /> Valider ce budget
                    </Button>
                )}
                {canManage && budget.statut === 'VALIDE' && (
                    <Button onClick={() => onActivate(budget.id)} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-9">
                        <ToggleRight className="h-4 w-4" /> Activer ce budget
                    </Button>
                )}
                {canManage && budget.statut === 'ACTIF' && (
                    <Button onClick={() => onDeactivate(budget.id)} variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 gap-2 h-9">
                        <ToggleLeft className="h-4 w-4" /> Désactiver ce budget
                    </Button>
                )}
                <Button onClick={() => onEdit(budget.id)} variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9">
                    <Pencil className="h-4 w-4" /> Modifier
                </Button>
            </div>
        </div>
    );
}


// ─── Formulaire de création simplifié ────────────────────────────────────────

interface SimpleBudgetFormProps {
    budgets: BudgetItem[];
    axes: AxeAnalytique[];
    initialBudget?: BudgetItem;
    onCancel: () => void;
    onSubmit: (data: BudgetFormData) => void;
}

// Interface pour les lignes de comptes comptables (budget analytique)
interface BudgetCompteLine {
    id: string;
    compteComptableId: string;
    montantAlloue: number;
    description: string;
}

function SimpleBudgetForm({ budgets, axes, initialBudget, onCancel, onSubmit }: SimpleBudgetFormProps) {
    const mountedRef = useIsMounted();
    const [type, setType] = useState<BudgetType>(initialBudget?.type ?? 'EXERCICE');
    const [nom, setNom] = useState(initialBudget?.nom ?? '');
    const [parentId, setParentId] = useState(initialBudget?.parentId ?? '');
    const [dateDebut, setDateDebut] = useState(initialBudget?.dateDebut ?? '');
    const [dateFin, setDateFin] = useState(initialBudget?.dateFin ?? '');
    const [seuilAlerte, setSeuilAlerte] = useState(String(initialBudget?.seuilAlerte ?? 80));
    const [selectedCentreIds, setSelectedCentreIds] = useState<string[]>([]);
    const [compteClasse6, setCompteClasse6] = useState<CompteDto[]>([]);
    // Lignes de comptes comptables pour le type ANALYTIQUE
    const [compteLines, setCompteLines] = useState<BudgetCompteLine[]>(
        initialBudget?.compteComptableLines?.length
            ? initialBudget.compteComptableLines.map((line, index) => ({
                id: `${index}`,
                compteComptableId: line.compteId,
                montantAlloue: line.montant,
                description: line.description,
            }))
            : [{ id: '1', compteComptableId: '', montantAlloue: 0, description: '' }]
    );

    // Exercices et périodes comptables depuis l'API
    const [exercicesComptables, setExercicesComptables] = useState<ExerciceComptableDto[]>([]);
    const [allPeriodesComptables, setAllPeriodesComptables] = useState<PeriodeComptableDto[]>([]);
    const [selectedExerciceComptableId, setSelectedExerciceComptableId] = useState(initialBudget?.exerciceId ?? '');
    const [selectedPeriodeComptableId, setSelectedPeriodeComptableId] = useState(initialBudget?.periodeId ?? '');

    // Charger exercices et périodes comptables au montage
    useEffect(() => {
        AccountingFiscalYearsService.getAllExercices()
            .then(res => {
                if (!mountedRef.current) return;
                if (res?.data) {
                    const ouverts = res.data.filter(e => !e.cloture && e.actif);
                    setExercicesComptables(ouverts);
                    if (!initialBudget && ouverts.length > 0) {
                        const ex = ouverts[0];
                        setSelectedExerciceComptableId(ex.id || '');
                        setDateDebut(ex.date_debut || '');
                        setDateFin(ex.date_fin || '');
                    }
                }
            })
            .catch(() => { });

        AccountingPeriodsService.getAllPeriodeComptables()
            .then(res => {
                if (!mountedRef.current) return;
                if (res?.data) setAllPeriodesComptables(res.data);
            })
            .catch(() => { });

        AccountingComptesService.getAllComptes()
            .then(res => {
                if (!mountedRef.current) return;
                const comptes = (res?.data ?? [])
                    .filter(c => c.actif !== false)
                    .filter(c => {
                        const classe = c.classe ?? Number.parseInt(c.noCompte?.charAt(0) ?? '', 10);
                        return classe === 6;
                    })
                    .sort((a, b) => (a.noCompte ?? '').localeCompare(b.noCompte ?? '', undefined, { numeric: true }));
                setCompteClasse6(comptes);
            })
            .catch(() => { });
    }, [initialBudget, mountedRef]);

    // Périodes comptables pour le select (type PERIODE)
    // Stratégie : filtrer par exercice comptable lié si possible, sinon toutes les non clôturées
    const periodesComptablesFiltrees = useMemo<PeriodeComptableDto[]>(() => {
        if (type !== 'PERIODE') return [];
        const toutesOuvertes = allPeriodesComptables.filter(p => !p.cloturee);
        if (!parentId) return toutesOuvertes;

        const budgetExercice = budgets.find(b => b.id === parentId);
        if (!budgetExercice) return toutesOuvertes;

        // Essayer de filtrer par exercice_id si on a l'exercice comptable correspondant
        const exComptable = exercicesComptables.find(e =>
            e.date_debut === budgetExercice.dateDebut && e.date_fin === budgetExercice.dateFin
        );

        if (exComptable) {
            const parExercice = toutesOuvertes.filter(p => p.exercice_id === exComptable.id);
            if (parExercice.length > 0) return parExercice;
        }

        // Fallback : filtrer par chevauchement de dates avec le budget exercice parent
        const parDates = toutesOuvertes.filter(p =>
            p.dateDebut >= budgetExercice.dateDebut && p.dateFin <= budgetExercice.dateFin
        );
        if (parDates.length > 0) return parDates;

        // Dernier recours : toutes les périodes ouvertes
        return toutesOuvertes;
    }, [type, parentId, budgets, allPeriodesComptables, exercicesComptables]);

    // Quand on sélectionne une période comptable, remplir les dates automatiquement
    const handlePeriodeComptableChange = (periodeId: string) => {
        setSelectedPeriodeComptableId(periodeId);
        const periode = periodesComptablesFiltrees.find(p => p.id === periodeId);
        if (periode) {
            setDateDebut(periode.dateDebut);
            setDateFin(periode.dateFin);
        }
    };

    // Quand on sélectionne un exercice comptable (type EXERCICE), remplir les dates
    const handleExerciceComptableChange = (exId: string) => {
        setSelectedExerciceComptableId(exId);
        const ex = exercicesComptables.find(e => e.id === exId);
        if (ex) {
            setDateDebut(ex.date_debut || '');
            setDateFin(ex.date_fin || '');
        }
    };

    const exercices = budgets.filter(b => b.type === 'EXERCICE');
    const activeAxes = axes.filter(a => a.actif);
    const activeCentres = mockCentres.filter(c => c.actif);

    const selectedAxeIds = useMemo(() => {
        const ids = new Set<string>();
        for (const centreId of selectedCentreIds) {
            const centre = activeCentres.find(c => c.id === centreId);
            if (!centre) continue;
            const axeId = resolveAxeIdForCentre(centre, activeAxes);
            if (axeId) ids.add(axeId);
        }
        return Array.from(ids);
    }, [selectedCentreIds, activeCentres, activeAxes]);

    const axesFromCentres = useMemo(
        () => selectedAxeIds
            .map(id => activeAxes.find(a => a.id === id))
            .filter((a): a is AxeAnalytique => Boolean(a)),
        [selectedAxeIds, activeAxes],
    );

    const axeDisplayLabel = axesFromCentres.length > 0
        ? axesFromCentres.map(a => `${a.code} — ${a.libelle}`).join(' · ')
        : selectedCentreIds.length > 0
            ? 'Axe(s) introuvable(s) pour le(s) centre(s) sélectionné(s)'
            : '';

    const parentBudget = budgets.find(b => b.id === parentId);

    const toggleCentre = (centreId: string) => {
        setSelectedCentreIds(prev =>
            prev.includes(centreId)
                ? prev.filter(id => id !== centreId)
                : [...prev, centreId]
        );
    };

    const getAxeLabelForCentre = (centre: CentreAnalyse) => {
        const axeId = resolveAxeIdForCentre(centre, activeAxes);
        const axe = activeAxes.find(a => a.id === axeId);
        return axe ? `${axe.code} — ${axe.libelle}` : '—';
    };

    const comptesPourLignes = useMemo(() => {
        const fromApi = compteClasse6.map(c => ({
            id: c.id ?? '',
            libelle: `${c.noCompte} — ${c.libelle}`,
        })).filter(c => c.id);

        if (fromApi.length > 0) return fromApi;

        const fromAxes = activeAxes
            .filter(a => selectedAxeIds.length === 0 || selectedAxeIds.includes(a.id))
            .flatMap(a => a.comptes || []);
        return fromAxes;
    }, [compteClasse6, activeAxes, selectedAxeIds]);

    const montantAlloue = compteLines.reduce((s, l) => s + (l.montantAlloue || 0), 0);

    const addCompteLine = () => {
        setCompteLines(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), compteComptableId: '', montantAlloue: 0, description: '' }]);
    };

    const removeCompteLine = (id: string) => {
        if (compteLines.length > 1) setCompteLines(prev => prev.filter(l => l.id !== id));
    };

    const updateCompteLine = <K extends keyof BudgetCompteLine>(id: string, field: K, value: BudgetCompteLine[K]) => {
        setCompteLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    // Validation plafond
    const getPlafondWarning = (): string | null => {
        const montantEffectif = montantAlloue;
        if (!parentBudget || !montantEffectif) return null;
        if (isNaN(montantEffectif)) return null;

        const siblings = budgets.filter(b => b.parentId === parentId);
        const sommeSiblings = siblings.reduce((s, b) => s + b.montantAlloue, 0);
        const total = sommeSiblings + montantEffectif;

        if (total > parentBudget.montantAlloue) {
            const disponible = parentBudget.montantAlloue - sommeSiblings;
            return `Attention : ce montant dépasse le budget disponible du parent. Disponible : ${disponible.toLocaleString('fr-FR')} XAF`;
        }
        return null;
    };

    const warning = getPlafondWarning();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nom) { toast.error('Le nom est obligatoire'); return; }
        if (montantAlloue <= 0) {
            toast.error('Ajoutez au moins une ligne budgétaire avec un compte et un montant');
            return;
        }
        if (compteLines.some(l => l.montantAlloue > 0 && !l.compteComptableId)) {
            toast.error('Chaque ligne avec un montant doit avoir un compte sélectionné');
            return;
        }
        if (type === 'PERIODE' && !parentId) { toast.error('Sélectionnez le budget annuel parent'); return; }
        if (type === 'EXERCICE' && exercicesComptables.length === 0) { toast.error('Aucun exercice comptable ouvert disponible'); return; }
        if (type === 'EXERCICE' && !selectedExerciceComptableId) { toast.error('Sélectionnez un exercice comptable'); return; }
        if (type === 'PERIODE' && !selectedPeriodeComptableId) { toast.error('Sélectionnez une période comptable'); return; }
        if (type === 'PERIODE' && (!dateDebut || !dateFin)) { toast.error('La période comptable sélectionnée doit avoir des dates valides'); return; }

        onSubmit({
            type, nom,
            montant: montantAlloue,
            parentId, dateDebut, dateFin,
            seuilAlerte: parseInt(seuilAlerte),
            axeIds: selectedAxeIds,
            centreIds: selectedCentreIds,
            axes: activeAxes,
            compteLines,
            exerciceComptableId: type === 'EXERCICE' ? selectedExerciceComptableId : undefined,
            periodeComptableId: type === 'PERIODE' ? selectedPeriodeComptableId : undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Type de budget <span className="text-red-500">*</span></Label>
                    <Select value={type} onValueChange={(v) => {
                        setType(v as BudgetType);
                        setParentId('');
                        setSelectedPeriodeComptableId('');
                        setDateDebut('');
                        setDateFin('');
                        setCompteLines([{ id: '1', compteComptableId: '', montantAlloue: 0, description: '' }]);
                        // Re-remplir les dates si on revient sur EXERCICE
                        if (v === 'EXERCICE' && selectedExerciceComptableId) {
                            const ex = exercicesComptables.find(e => e.id === selectedExerciceComptableId);
                            if (ex) { setDateDebut(ex.date_debut || ''); setDateFin(ex.date_fin || ''); }
                        }
                    }}>
                        <SelectTrigger className="border-slate-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EXERCICE">Budget annuel — rattaché à l&apos;exercice comptable</SelectItem>
                            <SelectItem value="PERIODE">Budget mensuel — rattaché à la période comptable</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* EXERCICE : auto-complétion depuis les exercices comptables ouverts */}
                {type === 'EXERCICE' && (
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">
                            Exercice comptable <span className="text-red-500">*</span>
                            <span className="ml-2 text-xs font-normal text-slate-400">(exercices ouverts)</span>
                        </Label>
                        {exercicesComptables.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                Aucun exercice comptable ouvert. Veuillez d'abord ouvrir un exercice comptable dans la configuration.
                            </div>
                        ) : (
                            <>
                                <Select value={selectedExerciceComptableId} onValueChange={handleExerciceComptableChange}>
                                    <SelectTrigger className="border-slate-300">
                                        <SelectValue placeholder="Sélectionner l'exercice comptable..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {exercicesComptables.map(ex => (
                                            <SelectItem key={ex.id} value={ex.id!}>
                                                {ex.libelle || ex.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {dateDebut && dateFin && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                                        <span>Période de l'exercice :</span>
                                        <span className="font-mono font-bold">{dateDebut}</span>
                                        <span>→</span>
                                        <span className="font-mono font-bold">{dateFin}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* PERIODE : sélection de l'exercice budget parent + période comptable ouverte */}
                {type === 'PERIODE' && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Budget annuel parent <span className="text-red-500">*</span></Label>
                            <Select value={parentId} onValueChange={(v) => { setParentId(v); setSelectedPeriodeComptableId(''); setDateDebut(''); setDateFin(''); }}>
                                <SelectTrigger className="border-slate-300">
                                    <SelectValue placeholder="Sélectionner un exercice..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {exercices.map(ex => (
                                        <SelectItem key={ex.id} value={ex.id}>{ex.nom} — {ex.montantAlloue.toLocaleString('fr-FR')} XAF</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Select période comptable — toujours visible dès que le type est PERIODE */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">
                                Période comptable <span className="text-red-500">*</span>
                                <span className="ml-2 text-xs font-normal text-slate-400">(périodes ouvertes de l'exercice en cours)</span>
                            </Label>
                            <Select value={selectedPeriodeComptableId} onValueChange={handlePeriodeComptableChange}>
                                <SelectTrigger className="border-slate-300">
                                    <SelectValue placeholder="Sélectionner une période comptable..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {periodesComptablesFiltrees.length === 0 ? (
                                        <div className="px-3 py-4 text-xs text-slate-400 italic text-center">
                                            Aucune période comptable ouverte disponible
                                        </div>
                                    ) : (
                                        periodesComptablesFiltrees.map(p => (
                                            <SelectItem key={p.id} value={p.id!}>
                                                {p.code} — {p.dateDebut} → {p.dateFin}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {periodesComptablesFiltrees.length === 0 && (
                                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    Aucune période comptable ouverte disponible. Veuillez en créer une dans la configuration.
                                </div>
                            )}
                            {dateDebut && dateFin && (
                                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                    <span>Période sélectionnée :</span>
                                    <span className="font-mono font-bold">{dateDebut}</span>
                                    <span>→</span>
                                    <span className="font-mono font-bold">{dateFin}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Nom du budget <span className="text-red-500">*</span></Label>
                    <Input placeholder="Ex: Budget Q1 2026" value={nom} onChange={e => setNom(e.target.value)} className="border-slate-300" />
                </div>

                {/* Centres d'analyse (multi) & axes rattachés */}
                {activeCentres.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">
                                Centres d&apos;analyse
                                {selectedCentreIds.length > 0 && (
                                    <span className="ml-2 text-xs font-normal text-slate-400">
                                        ({selectedCentreIds.length} sélectionné{selectedCentreIds.length > 1 ? 's' : ''})
                                    </span>
                                )}
                            </Label>
                            <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
                                {activeCentres.map(centre => (
                                    <label
                                        key={centre.id}
                                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCentreIds.includes(centre.id)}
                                            onChange={() => toggleCentre(centre.id)}
                                            className="mt-0.5 rounded"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <span className="text-sm text-slate-700 block">
                                                {centre.code} — {centre.libelle}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Axe : {getAxeLabelForCentre(centre)}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500">
                                Plusieurs centres peuvent être sélectionnés, même sur des axes analytiques différents.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Axes analytiques rattachés</Label>
                            {axesFromCentres.length > 0 ? (
                                <div className="border border-slate-200 rounded-lg bg-slate-50 divide-y divide-slate-100">
                                    {axesFromCentres.map(axe => (
                                        <div key={axe.id} className="px-3 py-2 text-sm text-slate-700">
                                            <span className="font-mono text-xs text-slate-500">{axe.code}</span>
                                            <span className="mx-1.5 text-slate-300">—</span>
                                            {axe.libelle}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Input
                                    readOnly
                                    value={axeDisplayLabel}
                                    placeholder="Sélectionnez un ou plusieurs centres"
                                    className="border-slate-300 bg-slate-50 text-slate-700 cursor-default"
                                />
                            )}
                            <p className="text-xs text-slate-500">
                                Les axes sont déduits automatiquement des centres sélectionnés.
                            </p>
                        </div>
                    </div>
                )}

                {/* Détail des lignes budgétaires */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-slate-700">
                            Détail des lignes budgétaires <span className="text-red-500">*</span>
                        </Label>
                        <span className="text-xs font-mono font-bold text-blue-700">
                            Total lignes : {montantAlloue.toLocaleString('fr-FR')} XAF
                        </span>
                    </div>
                    {warning && type === 'PERIODE' && (
                        <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {warning}
                        </div>
                    )}
                    {parentBudget && type === 'PERIODE' && (
                        <p className="text-xs text-slate-400">
                            Budget parent : {parentBudget.montantAlloue.toLocaleString('fr-FR')} XAF alloués,
                            déjà répartis : {budgets.filter(b => b.parentId === parentId).reduce((s, b) => s + b.montantAlloue, 0).toLocaleString('fr-FR')} XAF
                        </p>
                    )}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2">Compte Classe 6</th>
                                    <th className="px-3 py-2 text-right w-36">Montant (XAF) *</th>
                                    <th className="px-3 py-2">Commentaire</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {compteLines.map(line => (
                                    <tr key={line.id} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2 w-56">
                                            {comptesPourLignes.length > 0 ? (
                                                <Select value={line.compteComptableId} onValueChange={val => updateCompteLine(line.id, 'compteComptableId', val)}>
                                                    <SelectTrigger className="h-8 border-slate-300 text-xs">
                                                        <SelectValue placeholder="Choisir un compte..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {comptesPourLignes.map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.libelle}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    placeholder="Ex: 605100 - Électricité"
                                                    value={line.compteComptableId}
                                                    onChange={e => updateCompteLine(line.id, 'compteComptableId', e.target.value)}
                                                    className="h-8 border-slate-300 text-xs"
                                                />
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input
                                                type="number"
                                                value={line.montantAlloue || ''}
                                                onChange={e => updateCompteLine(line.id, 'montantAlloue', parseFloat(e.target.value) || 0)}
                                                className="h-8 border-slate-300 text-xs text-right font-mono"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input
                                                placeholder="Ex: Consommation usine"
                                                value={line.description}
                                                onChange={e => updateCompteLine(line.id, 'description', e.target.value)}
                                                className="h-8 border-slate-300 text-xs"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <Button
                                                type="button" variant="ghost" size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeCompteLine(line.id)}
                                                disabled={compteLines.length === 1}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <Button
                                type="button" variant="outline" size="sm"
                                onClick={addCompteLine}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 border-dashed text-xs h-7"
                            >
                                <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Ajouter une ligne
                            </Button>
                            <span className="text-xs font-bold text-slate-600">
                                Somme des lignes : {montantAlloue.toLocaleString('fr-FR')} XAF
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                        Montant alloué (XAF) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        readOnly
                        value={montantAlloue > 0 ? montantAlloue.toLocaleString('fr-FR') : ''}
                        placeholder="Calculé automatiquement depuis les lignes"
                        className="border-slate-300 bg-slate-50 font-mono text-slate-800 cursor-default"
                    />
                    <p className="text-xs text-slate-500">
                        Le montant alloué correspond à la somme des lignes budgétaires.
                    </p>
                    {warning && (
                        <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {warning}
                        </div>
                    )}
                    {parentBudget && type === 'PERIODE' && (
                        <p className="text-xs text-slate-400">
                            Budget annuel parent : {parentBudget.montantAlloue.toLocaleString('fr-FR')} XAF alloués,
                            déjà répartis : {budgets.filter(b => b.parentId === parentId).reduce((s, b) => s + b.montantAlloue, 0).toLocaleString('fr-FR')} XAF
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Seuil d'alerte (%)</Label>
                    <Select value={seuilAlerte} onValueChange={setSeuilAlerte}>
                        <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="80">80%</SelectItem>
                            <SelectItem value="90">90%</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            </div>{/* fin du contenu scrollable */}

            {/* Footer fixe avec les boutons */}
            <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Save className="h-4 w-4" /> {initialBudget ? 'Mettre à jour' : 'Enregistrer en brouillon'}
                </Button>
            </div>
        </form>
    );
}


// ─── Page principale ──────────────────────────────────────────────────────────

export default function BudgetsPage() {
    const mountedRef = useIsMounted();
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [budgetToDelete, setBudgetToDelete] = useState<BudgetItem | null>(null);
    const [selectedBudget, setSelectedBudget] = useState<BudgetItem | null>(null);
    const [axes, setAxes] = useState<AxeAnalytique[]>([]);
    const { onOpen, onClose: closeCompose } = useCompose();
    const { accountingRole } = useAuth();
    const canManage = hasPermission(accountingRole, 'budgets', 'lock');
    const canCreate = hasPermission(accountingRole, 'budgets', 'create');

    const loadBudgets = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await AccountingBudgetsService.getAllBudgets();
            if (!mountedRef.current) return;
            const nextBudgets = (response.data ?? []).map(mapBudgetDto);
            setBudgets(nextBudgets);
            setSelectedBudget(prev => prev ? nextBudgets.find(b => b.id === prev.id) ?? null : null);
        } catch (error) {
            if (!mountedRef.current) return;
            console.error('Failed to load budgets:', error);
            toast.error('Impossible de charger les budgets depuis le backend.');
        } finally {
            if (mountedRef.current) setIsLoading(false);
        }
    }, [mountedRef]);

    const loadAxes = useCallback(async () => {
        try {
            const response = await AccountingAnalyticsService.getActiveAxes();
            if (!mountedRef.current) return;
            setAxes((response.data ?? []).map(mapAxeDto));
        } catch (error) {
            if (!mountedRef.current) return;
            console.error('Failed to load analytical axes:', error);
            toast.error('Impossible de charger les axes analytiques actifs.');
        }
    }, [mountedRef]);

    useEffect(() => {
        loadBudgets();
        loadAxes();
    }, [loadBudgets, loadAxes]);

    const handleRefresh = () => {
        loadBudgets();
        loadAxes();
    };

    const handleSelect = (b: BudgetItem) => setSelectedBudget(b);

    const replaceBudget = (budget: BudgetItem) => {
        setBudgets(prev => prev.map(b => b.id === budget.id ? budget : b));
        if (selectedBudget?.id === budget.id) setSelectedBudget(budget);
    };

    const handleValidate = async (id: string) => {
        try {
            const response = await AccountingBudgetsService.validateBudget(id);
            if (response.data) replaceBudget(mapBudgetDto(response.data));
            toast.success('Budget validé');
        } catch (error) {
            console.error('Failed to validate budget:', error);
            toast.error('Impossible de valider ce budget.');
        }
    };

    const handleActivate = async (id: string) => {
        try {
            const response = await AccountingBudgetsService.activateBudget(id);
            if (response.data) replaceBudget(mapBudgetDto(response.data));
            toast.success('Budget activé');
        } catch (error) {
            console.error('Failed to activate budget:', error);
            toast.error("Impossible d'activer ce budget.");
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            const response = await AccountingBudgetsService.deactivateBudget(id);
            if (response.data) replaceBudget(mapBudgetDto(response.data));
            toast.success('Budget désactivé');
        } catch (error) {
            console.error('Failed to deactivate budget:', error);
            toast.error('Impossible de désactiver ce budget.');
        }
    };

    const handleEdit = (id: string) => {
        const budgetToEdit = budgets.find(b => b.id === id);
        if (!budgetToEdit) return;

        onOpen({
            title: `Modifier le budget : ${budgetToEdit.nom}`,
            content: (
                <SimpleBudgetForm
                    budgets={budgets}
                    axes={axes}
                    initialBudget={budgetToEdit}
                    onCancel={closeCompose}
                    onSubmit={async (data) => {
                        const parentBudget = budgets.find(b => b.id === data.parentId);
                        const dto = toBudgetDto(data, parentBudget);
                        if (!dto) return;
                        dto.code = budgetToEdit.code;
                        dto.statut = budgetToEdit.statut === 'BROUILLON' ? 'BROUILLON' : budgetToEdit.statut;

                        try {
                            const response = await AccountingBudgetsService.updateBudget(id, dto);
                            if (response.data) replaceBudget(mapBudgetDto(response.data));
                            closeCompose();
                            toast.success(`Budget "${data.nom}" mis à jour`);
                        } catch (error) {
                            console.error('Failed to update budget:', error);
                            toast.error('Impossible de modifier ce budget.');
                        }
                    }}
                />
            )
        });
    };

    const handleLock = (id: string) => {
        toast.info('Clôture indisponible', { description: `Le backend n'expose pas encore d'endpoint de clôture pour le budget ${id}.` });
    };

    const handleDelete = async () => {
        if (!budgetToDelete) return;
        try {
            await AccountingBudgetsService.deleteBudget(budgetToDelete.id);
            setBudgets(prev => prev.filter(b => b.id !== budgetToDelete.id));
            if (selectedBudget?.id === budgetToDelete.id) setSelectedBudget(null);
            toast.success('Budget supprimé');
            setBudgetToDelete(null);
        } catch (error) {
            console.error('Failed to delete budget:', error);
            toast.error('Impossible de supprimer ce budget.');
        }
    };

    const handleAddNew = () => {
        onOpen({
            title: 'Nouveau Budget',
            content: (
                <SimpleBudgetForm
                    budgets={budgets}
                    axes={axes}
                    onCancel={closeCompose}
                    onSubmit={async (data) => {
                        const parentBudget = budgets.find(b => b.id === data.parentId);
                        const dto = toBudgetDto(data, parentBudget);
                        if (!dto) return;

                        try {
                            const response = await AccountingBudgetsService.createBudget(dto);
                            const newBudget = response.data ? mapBudgetDto(response.data) : null;
                            if (newBudget) setBudgets(prev => [newBudget, ...prev]);
                            closeCompose();
                            toast.success(`Budget "${data.nom}" créé en brouillon`);
                        } catch (error) {
                            console.error('Failed to create budget:', error);
                            toast.error('Impossible de créer ce budget.');
                        }
                    }}
                />
            )
        });
    };

    return (
        <div className="min-h-screen flex flex-col p-4 bg-gray-100">
            <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-1">Gestion Budgétaire</h2>
                    <p className="text-sm text-gray-500">
                        Création et gestion des budgets annuels (exercice), mensuels (période) et analytiques. Chaque création démarre en <strong>brouillon</strong> ; seul le Responsable comptable peut valider.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row" style={{ minHeight: '600px' }}>
                    {/* Contenu principal */}
                    <div className="flex-1 p-6 overflow-auto min-w-0">
                        <Tabs defaultValue="hierarchie" className="w-full">
                            <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg h-10">
                                <TabsTrigger value="hierarchie" className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4" /> Vue Hiérarchique
                                </TabsTrigger>
                                <TabsTrigger value="liste" className="flex items-center gap-2 text-sm">
                                    <List className="h-4 w-4" /> Liste
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="hierarchie">
                                <div className="flex justify-end mb-4">
                                    {canCreate && (
                                        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                            <Plus className="h-4 w-4" /> Nouveau Budget (brouillon)
                                        </Button>
                                    )}
                                </div>
                                <HierarchyView budgets={budgets} onSelect={handleSelect} selectedId={selectedBudget?.id} />
                            </TabsContent>

                            <TabsContent value="liste">
                                <BudgetListView
                                    budgets={budgets}
                                    isLoading={isLoading}
                                    onEdit={handleEdit}
                                    onView={(id) => { const b = budgets.find(x => x.id === id); if (b) handleSelect(b); }}
                                    onDelete={(b) => setBudgetToDelete(b)}
                                    onAddNew={handleAddNew}
                                    onRefresh={handleRefresh}
                                    onLock={handleLock}
                                    onValidate={canManage ? handleValidate : undefined}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Panneau détail */}
                    {selectedBudget && (
                        <DetailPanel
                            budget={selectedBudget}
                            allBudgets={budgets}
                            onClose={() => setSelectedBudget(null)}
                            onValidate={handleValidate}
                            onActivate={handleActivate}
                            onDeactivate={handleDeactivate}
                            onEdit={handleEdit}
                            canManage={canManage}
                        />
                    )}
                </div>
            </div>

            <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce budget ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le budget "{budgetToDelete?.nom}" sera définitivement supprimé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
