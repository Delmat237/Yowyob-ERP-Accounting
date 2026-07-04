// components/accounting/budget-list-view.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Lock, Eye, CheckCircle } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { PermissionGuard } from '@/components/auth/permission-guard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetType = 'EXERCICE' | 'PERIODE' | 'ANALYTIQUE';
export type BudgetStatut = 'BROUILLON' | 'VALIDE' | 'ACTIF' | 'INACTIF' | 'CLOTURE';

export interface BudgetItem {
    id: string;
    code: string;
    nom: string;
    type: BudgetType;
    statut: BudgetStatut;
    montantAlloue: number;
    montantConsomme: number;
    parentId?: string;
    parentNom?: string;
    exerciceId?: string;
    periodeId?: string;
    axeIds?: string[];
    axeLibelles?: string;
    dateDebut: string;
    dateFin: string;
    compteComptableLines?: {
        compteId: string;
        compteLibelle: string;
        montant: number;
        description: string;
    }[];
    responsable?: string;
    seuilAlerte: number;
}

// Keep legacy Budget type for backward compatibility with budget-vs-realise-view
export interface Budget {
    id: string;
    name: string;
    code: string;
    axeAnalytique: string;
    montantAlloue: number;
    montantConsomme: number;
    dateDebut: string;
    dateFin: string;
    statut: 'ACTIF' | 'CLOTURE' | 'BROUILLON';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BudgetListViewProps {
    budgets: BudgetItem[];
    isLoading: boolean;
    onEdit: (id: string) => void;
    onView?: (id: string) => void;
    onDelete: (budget: BudgetItem) => void;
    onAddNew: () => void;
    onLock: (id: string) => void;
    onValidate?: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statutColors: Record<BudgetStatut, string> = {
    BROUILLON: 'bg-yellow-100 text-yellow-800',
    VALIDE: 'bg-blue-100 text-blue-800',
    ACTIF: 'bg-green-100 text-green-800',
    INACTIF: 'bg-gray-100 text-gray-600',
    CLOTURE: 'bg-slate-100 text-slate-600',
};

const typeColors: Record<BudgetType, string> = {
    EXERCICE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    PERIODE: 'bg-blue-100 text-blue-700 border-blue-200',
    ANALYTIQUE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const typeLabels: Record<BudgetType, string> = {
    EXERCICE: 'Exercice',
    PERIODE: 'Période',
    ANALYTIQUE: 'Analytique',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const BudgetListView: React.FC<BudgetListViewProps> = ({
    budgets = [],
    isLoading,
    onEdit,
    onView,
    onDelete,
    onAddNew,
    onLock,
    onValidate,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');

    const filtered = budgets.filter((b) => {
        const matchSearch =
            b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.axeLibelles ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === 'ALL' || b.type === filterType;
        return matchSearch && matchType;
    });

    if (isLoading) return <CustomPageLoader message="Chargement des budgets..." />;

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-3">
                    <div className="relative max-w-xl flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher par nom, code ou axe..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white border-gray-300"
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[160px] border-gray-300 bg-white">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tous les types</SelectItem>
                            <SelectItem value="EXERCICE">Exercice</SelectItem>
                            <SelectItem value="PERIODE">Période</SelectItem>
                            <SelectItem value="ANALYTIQUE">Analytique</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <PermissionGuard feature="budgets" action="create">
                        <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau Budget
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total budgets', value: budgets.length, color: 'blue' },
                    { label: 'Exercices', value: budgets.filter(b => b.type === 'EXERCICE').length, color: 'indigo' },
                    { label: 'Actifs', value: budgets.filter(b => b.statut === 'ACTIF').length, color: 'green' },
                    {
                        label: 'Budget total alloué',
                        value: budgets
                            .filter(b => b.type === 'EXERCICE')
                            .reduce((s, b) => s + b.montantAlloue, 0)
                            .toLocaleString('fr-FR') + ' XAF',
                        color: 'purple',
                    },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`p-4 rounded-lg bg-${color}-50 border border-${color}-100`}>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className={`text-xl font-bold text-${color}-700`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="py-3 px-4">Code</TableHead>
                                <TableHead className="py-3 px-4">Nom</TableHead>
                                <TableHead className="py-3 px-4">Type</TableHead>
                                <TableHead className="py-3 px-4">Parent</TableHead>
                                <TableHead className="py-3 px-4 text-right">Alloué (XAF)</TableHead>
                                <TableHead className="py-3 px-4 text-right">Consommé (XAF)</TableHead>
                                <TableHead className="py-3 px-4">Période</TableHead>
                                <TableHead className="py-3 px-4">Statut</TableHead>
                                <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-40 text-center text-gray-500">
                                        Aucun budget trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((budget) => {
                                    const ratio = budget.montantAlloue > 0
                                        ? Math.min(100, Math.round((budget.montantConsomme / budget.montantAlloue) * 100))
                                        : 0;
                                    return (
                                        <TableRow key={budget.id} className="hover:bg-gray-50 border-b border-gray-100">
                                            <TableCell className="py-3 px-4 font-mono text-sm font-bold">{budget.code}</TableCell>
                                            <TableCell className="py-3 px-4 font-medium">{budget.nom}</TableCell>
                                            <TableCell className="py-3 px-4">
                                                <Badge variant="outline" className={`text-xs ${typeColors[budget.type]}`}>
                                                    {typeLabels[budget.type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 text-sm">
                                                {budget.parentNom ?? <span className="text-gray-300 italic">—</span>}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right font-mono">
                                                {budget.montantAlloue.toLocaleString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <div className="space-y-1">
                                                    <div className="text-right font-mono text-sm">{budget.montantConsomme.toLocaleString('fr-FR')}</div>
                                                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                                                        <div
                                                            className={`h-1.5 rounded-full ${ratio >= 90 ? 'bg-red-500' : ratio >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                            style={{ width: `${ratio}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-right text-xs text-gray-500">{ratio}%</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-xs text-gray-500">
                                                {budget.dateDebut} → {budget.dateFin}
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statutColors[budget.statut]}`}>
                                                    {budget.statut}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="flex justify-end gap-1">
                                                    {onView && (
                                                        <Button variant="outline" size="sm" onClick={() => onView(budget.id)}
                                                            className="h-7 px-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs"
                                                            title="Voir les détails">
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {/* Bouton Valider — RESPONSABLE_COMPTABLE + BROUILLON */}
                                                    {onValidate && budget.statut === 'BROUILLON' && (
                                                        <PermissionGuard feature="budgets" action="lock">
                                                            <Button variant="outline" size="sm" onClick={() => onValidate(budget.id)}
                                                                className="h-7 px-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs"
                                                                title="Valider">
                                                                <CheckCircle className="h-3 w-3" />
                                                            </Button>
                                                        </PermissionGuard>
                                                    )}
                                                    <PermissionGuard feature="budgets" action="update">
                                                        <Button variant="outline" size="sm" onClick={() => onEdit(budget.id)}
                                                            className="h-7 px-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs"
                                                            title="Modifier">
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </PermissionGuard>
                                                    <PermissionGuard feature="budgets" action="lock">
                                                        <Button variant="outline" size="sm" onClick={() => onLock(budget.id)}
                                                            className="h-7 px-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs"
                                                            disabled={budget.statut === 'CLOTURE'}
                                                            title="Clôturer">
                                                            <Lock className="h-3 w-3" />
                                                        </Button>
                                                    </PermissionGuard>
                                                    <PermissionGuard feature="budgets" action="update">
                                                        <Button variant="outline" size="sm" onClick={() => onDelete(budget)}
                                                            className="h-7 px-2 border-red-200 text-red-700 hover:bg-red-50 text-xs"
                                                            disabled={budget.statut === 'ACTIF'}
                                                            title="Supprimer">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </PermissionGuard>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};
