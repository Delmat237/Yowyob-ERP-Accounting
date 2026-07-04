// components/accounting/budget-vs-realise-view.tsx
"use client";

import React, { useState, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    TrendingUp, TrendingDown, Minus, Search,
    AlertTriangle, CheckCircle2, XCircle, BarChart3, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Budget } from './budget-list-view';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BudgetLine {
    id: string;
    compteComptable: string;
    description: string;
    montantAlloue: number;
    montantRealise: number;
}

export interface BudgetDetail extends Budget {
    lines: BudgetLine[];
}

// ─── Mock réalisé par ligne (simulé en attendant le backend) ──────────────────

function buildMockDetails(budgets: Budget[]): BudgetDetail[] {
    return budgets.map((b) => ({
        ...b,
        lines: [
            {
                id: `${b.id}-l1`,
                compteComptable: '601 - Achats de marchandises',
                description: 'Approvisionnements',
                montantAlloue: Math.round(b.montantAlloue * 0.4),
                montantRealise: Math.round(b.montantConsomme * 0.45),
            },
            {
                id: `${b.id}-l2`,
                compteComptable: '641 - Salaires',
                description: 'Charges de personnel',
                montantAlloue: Math.round(b.montantAlloue * 0.35),
                montantRealise: Math.round(b.montantConsomme * 0.30),
            },
            {
                id: `${b.id}-l3`,
                compteComptable: '623 - Publicité',
                description: 'Communication & marketing',
                montantAlloue: Math.round(b.montantAlloue * 0.15),
                montantRealise: Math.round(b.montantConsomme * 0.15),
            },
            {
                id: `${b.id}-l4`,
                compteComptable: '613 - Loyers',
                description: 'Charges locatives',
                montantAlloue: Math.round(b.montantAlloue * 0.10),
                montantRealise: Math.round(b.montantConsomme * 0.10),
            },
        ],
    }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ecart(alloue: number, realise: number) {
    return alloue - realise;
}

function tauxConsommation(alloue: number, realise: number): number {
    if (alloue === 0) return 0;
    return Math.min(999, Math.round((realise / alloue) * 100));
}

function ecartPct(alloue: number, realise: number): number {
    if (alloue === 0) return 0;
    return Math.round(((alloue - realise) / alloue) * 100);
}

function statutConsommation(taux: number, seuilAlerte: number = 80): 'ok' | 'alerte' | 'depassement' {
    if (taux > 100) return 'depassement';
    if (taux >= seuilAlerte) return 'alerte';
    return 'ok';
}

// ─── Sous-composant : barre de progression ────────────────────────────────────

function ProgressBar({ taux, statut }: { taux: number; statut: 'ok' | 'alerte' | 'depassement' }) {
    const colors = {
        ok: 'bg-green-500',
        alerte: 'bg-yellow-500',
        depassement: 'bg-red-500',
    };
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={cn('h-2 rounded-full transition-all', colors[statut])}
                    style={{ width: `${Math.min(100, taux)}%` }}
                />
            </div>
            <span className={cn(
                'text-xs font-bold w-10 text-right',
                statut === 'depassement' ? 'text-red-600' :
                    statut === 'alerte' ? 'text-yellow-600' : 'text-green-600'
            )}>
                {taux}%
            </span>
        </div>
    );
}

// ─── Sous-composant : badge statut ────────────────────────────────────────────

function StatutBadge({ statut }: { statut: 'ok' | 'alerte' | 'depassement' }) {
    if (statut === 'depassement') return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-[10px]">
            <XCircle className="h-3 w-3" /> Dépassement
        </Badge>
    );
    if (statut === 'alerte') return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1 text-[10px]">
            <AlertTriangle className="h-3 w-3" /> Alerte
        </Badge>
    );
    return (
        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" /> Normal
        </Badge>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface BudgetVsRealiseViewProps {
    budgets: Budget[];
    isLoading: boolean;
}

export function BudgetVsRealiseView({ budgets, isLoading }: BudgetVsRealiseViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatut, setFilterStatut] = useState<string>('ALL');
    const [filterAlerte, setFilterAlerte] = useState<string>('ALL');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const details = useMemo(() => buildMockDetails(budgets), [budgets]);

    const filtered = useMemo(() => {
        return details.filter((b) => {
            const matchSearch =
                b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.axeAnalytique.toLowerCase().includes(searchTerm.toLowerCase());

            const matchStatut = filterStatut === 'ALL' || b.statut === filterStatut;

            const taux = tauxConsommation(b.montantAlloue, b.montantConsomme);
            const statut = statutConsommation(taux);
            const matchAlerte =
                filterAlerte === 'ALL' ||
                (filterAlerte === 'depassement' && statut === 'depassement') ||
                (filterAlerte === 'alerte' && statut === 'alerte') ||
                (filterAlerte === 'ok' && statut === 'ok');

            return matchSearch && matchStatut && matchAlerte;
        });
    }, [details, searchTerm, filterStatut, filterAlerte]);

    // KPIs globaux
    const totalAlloue = budgets.reduce((s, b) => s + b.montantAlloue, 0);
    const totalRealise = budgets.reduce((s, b) => s + b.montantConsomme, 0);
    const totalEcart = totalAlloue - totalRealise;
    const tauxGlobal = tauxConsommation(totalAlloue, totalRealise);
    const nbDepassements = details.filter(b => tauxConsommation(b.montantAlloue, b.montantConsomme) > 100).length;
    const nbAlertes = details.filter(b => {
        const t = tauxConsommation(b.montantAlloue, b.montantConsomme);
        return t >= 80 && t <= 100;
    }).length;

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-6">

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Budget Total Alloué</p>
                    <p className="text-xl font-black text-blue-800">{totalAlloue.toLocaleString('fr-FR')} <span className="text-sm font-normal">XAF</span></p>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
                    <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Total Réalisé</p>
                    <p className="text-xl font-black text-indigo-800">{totalRealise.toLocaleString('fr-FR')} <span className="text-sm font-normal">XAF</span></p>
                    <ProgressBar taux={tauxGlobal} statut={statutConsommation(tauxGlobal)} />
                </div>
                <div className={cn(
                    'p-4 rounded-xl border space-y-1',
                    totalEcart >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                )}>
                    <p className={cn('text-xs font-semibold uppercase tracking-wider', totalEcart >= 0 ? 'text-green-500' : 'text-red-500')}>
                        Écart Global
                    </p>
                    <div className="flex items-center gap-1">
                        {totalEcart >= 0
                            ? <TrendingDown className="h-4 w-4 text-green-600" />
                            : <TrendingUp className="h-4 w-4 text-red-600" />}
                        <p className={cn('text-xl font-black', totalEcart >= 0 ? 'text-green-800' : 'text-red-800')}>
                            {Math.abs(totalEcart).toLocaleString('fr-FR')} <span className="text-sm font-normal">XAF</span>
                        </p>
                    </div>
                    <p className="text-xs text-gray-500">{totalEcart >= 0 ? 'Sous-consommation' : 'Sur-consommation'}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Alertes</p>
                    <div className="flex gap-2 flex-wrap">
                        {nbDepassements > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                <XCircle className="h-3 w-3" /> {nbDepassements} dépassement{nbDepassements > 1 ? 's' : ''}
                            </span>
                        )}
                        {nbAlertes > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="h-3 w-3" /> {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''}
                            </span>
                        )}
                        {nbDepassements === 0 && nbAlertes === 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                <CheckCircle2 className="h-3 w-3" /> Tout est normal
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Filtres ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher un budget..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 border-gray-300 bg-white"
                    />
                </div>
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                    <SelectTrigger className="w-[160px] border-gray-300 bg-white">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tous les statuts</SelectItem>
                        <SelectItem value="ACTIF">Actif</SelectItem>
                        <SelectItem value="BROUILLON">Brouillon</SelectItem>
                        <SelectItem value="CLOTURE">Clôturé</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterAlerte} onValueChange={setFilterAlerte}>
                    <SelectTrigger className="w-[180px] border-gray-300 bg-white">
                        <SelectValue placeholder="Niveau d'alerte" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Toutes les alertes</SelectItem>
                        <SelectItem value="depassement">Dépassements</SelectItem>
                        <SelectItem value="alerte">En alerte</SelectItem>
                        <SelectItem value="ok">Normal</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Tableau principal ── */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-8 py-3 px-2" />
                            <TableHead className="py-3 px-4">Budget</TableHead>
                            <TableHead className="py-3 px-4">Axe Analytique</TableHead>
                            <TableHead className="py-3 px-4 text-right">Alloué (XAF)</TableHead>
                            <TableHead className="py-3 px-4 text-right">Réalisé (XAF)</TableHead>
                            <TableHead className="py-3 px-4 text-right">Écart (XAF)</TableHead>
                            <TableHead className="py-3 px-4">Consommation</TableHead>
                            <TableHead className="py-3 px-4">Statut</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center text-gray-400">
                                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    Aucun budget ne correspond aux filtres sélectionnés.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((budget) => {
                                const taux = tauxConsommation(budget.montantAlloue, budget.montantConsomme);
                                const statut = statutConsommation(taux);
                                const ecartVal = ecart(budget.montantAlloue, budget.montantConsomme);
                                const isExpanded = expandedIds.has(budget.id);

                                return (
                                    <React.Fragment key={budget.id}>
                                        {/* ── Ligne budget ── */}
                                        <TableRow
                                            className={cn(
                                                'hover:bg-gray-50 border-b border-gray-100 cursor-pointer',
                                                statut === 'depassement' && 'bg-red-50/30',
                                                statut === 'alerte' && 'bg-yellow-50/20',
                                            )}
                                            onClick={() => toggleExpand(budget.id)}
                                        >
                                            <TableCell className="py-3 px-2 text-gray-400">
                                                {isExpanded
                                                    ? <ChevronDown className="h-4 w-4" />
                                                    : <ChevronRight className="h-4 w-4" />}
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{budget.name}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{budget.code}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-sm text-gray-600">{budget.axeAnalytique}</TableCell>
                                            <TableCell className="py-3 px-4 text-right font-mono text-sm font-semibold text-gray-800">
                                                {budget.montantAlloue.toLocaleString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right font-mono text-sm font-semibold text-indigo-700">
                                                {budget.montantConsomme.toLocaleString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {ecartVal > 0
                                                        ? <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                                                        : ecartVal < 0
                                                            ? <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                                                            : <Minus className="h-3.5 w-3.5 text-gray-400" />}
                                                    <span className={cn(
                                                        'font-mono text-sm font-semibold',
                                                        ecartVal > 0 ? 'text-green-700' : ecartVal < 0 ? 'text-red-700' : 'text-gray-500'
                                                    )}>
                                                        {ecartVal >= 0 ? '+' : ''}{ecartVal.toLocaleString('fr-FR')}
                                                    </span>
                                                </div>
                                                <p className="text-right text-[10px] text-gray-400 mt-0.5">
                                                    {ecartPct(budget.montantAlloue, budget.montantConsomme) >= 0 ? '+' : ''}
                                                    {ecartPct(budget.montantAlloue, budget.montantConsomme)}%
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <ProgressBar taux={taux} statut={statut} />
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <StatutBadge statut={statut} />
                                            </TableCell>
                                        </TableRow>

                                        {/* ── Lignes détail (expandable) ── */}
                                        {isExpanded && (
                                            <TableRow className="bg-slate-50/60">
                                                <TableCell colSpan={8} className="p-0">
                                                    <div className="px-10 py-4 space-y-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                                            Détail par compte comptable
                                                        </p>
                                                        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-slate-100/60 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left">Compte</th>
                                                                        <th className="px-4 py-2 text-left">Description</th>
                                                                        <th className="px-4 py-2 text-right">Alloué</th>
                                                                        <th className="px-4 py-2 text-right">Réalisé</th>
                                                                        <th className="px-4 py-2 text-right">Écart</th>
                                                                        <th className="px-4 py-2">Taux</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {budget.lines.map((line) => {
                                                                        const lineTaux = tauxConsommation(line.montantAlloue, line.montantRealise);
                                                                        const lineStatut = statutConsommation(lineTaux);
                                                                        const lineEcart = ecart(line.montantAlloue, line.montantRealise);
                                                                        return (
                                                                            <tr key={line.id} className="hover:bg-slate-50/50">
                                                                                <td className="px-4 py-2 font-mono text-xs text-indigo-700 font-semibold">
                                                                                    {line.compteComptable}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-xs text-slate-600">{line.description}</td>
                                                                                <td className="px-4 py-2 text-right font-mono text-xs text-slate-700">
                                                                                    {line.montantAlloue.toLocaleString('fr-FR')}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono text-xs text-indigo-600 font-semibold">
                                                                                    {line.montantRealise.toLocaleString('fr-FR')}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono text-xs">
                                                                                    <span className={cn(
                                                                                        'font-semibold',
                                                                                        lineEcart > 0 ? 'text-green-600' : lineEcart < 0 ? 'text-red-600' : 'text-gray-400'
                                                                                    )}>
                                                                                        {lineEcart >= 0 ? '+' : ''}{lineEcart.toLocaleString('fr-FR')}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-2">
                                                                                    <ProgressBar taux={lineTaux} statut={lineStatut} />
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                                {/* Totaux ligne */}
                                                                <tfoot className="bg-slate-100/80 border-t border-slate-200">
                                                                    <tr>
                                                                        <td colSpan={2} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">Total</td>
                                                                        <td className="px-4 py-2 text-right font-mono text-xs font-black text-slate-800">
                                                                            {budget.lines.reduce((s, l) => s + l.montantAlloue, 0).toLocaleString('fr-FR')}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right font-mono text-xs font-black text-indigo-700">
                                                                            {budget.lines.reduce((s, l) => s + l.montantRealise, 0).toLocaleString('fr-FR')}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right font-mono text-xs font-black">
                                                                            <span className={ecartVal >= 0 ? 'text-green-700' : 'text-red-700'}>
                                                                                {ecartVal >= 0 ? '+' : ''}{ecartVal.toLocaleString('fr-FR')}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <ProgressBar taux={taux} statut={statut} />
                                                                        </td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Légende ── */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Normal (consommation &lt; seuil d'alerte)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Alerte (≥ seuil d'alerte, ≤ 100%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Dépassement (&gt; 100% du budget alloué)</span>
                </div>
            </div>
        </div>
    );
}
