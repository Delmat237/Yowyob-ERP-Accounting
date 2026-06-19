"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    CheckCircle, XCircle, Search, RefreshCw, ShieldCheck,
    Building2, Calendar, Layers, AlertTriangle, Eye, CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type BudgetType = 'EXERCICE' | 'PERIODE' | 'ANALYTIQUE';

interface BudgetBrouillon {
    id: string;
    code: string;
    nom: string;
    type: BudgetType;
    montantAlloue: number;
    parentNom?: string;
    axeLibelles?: string;
    dateDebut: string;
    dateFin: string;
    responsable?: string;
    createdBy: string;
    createdAt: string;
    seuilAlerte: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BROUILLONS: BudgetBrouillon[] = [
    {
        id: 'p3', code: 'PER-2026-Q3', nom: 'Budget Q3 2026', type: 'PERIODE',
        montantAlloue: 12500000, parentNom: 'Budget Exercice 2026',
        dateDebut: '2026-07-01', dateFin: '2026-09-30', seuilAlerte: 80,
        createdBy: 'Jean Comptable', createdAt: '2026-06-15',
    },
    {
        id: 'an3', code: 'ANA-RH-Q1', nom: 'RH Formation Q1', type: 'ANALYTIQUE',
        montantAlloue: 3000000, parentNom: 'Budget Q1 2026',
        axeLibelles: 'Ressources Humaines',
        dateDebut: '2026-01-01', dateFin: '2026-03-31', seuilAlerte: 80,
        createdBy: 'Marie Aide-Comptable', createdAt: '2026-01-10',
    },
    {
        id: 'ex2', code: 'EX-2027', nom: 'Budget Exercice 2027', type: 'EXERCICE',
        montantAlloue: 60000000,
        dateDebut: '2027-01-01', dateFin: '2027-12-31', seuilAlerte: 80,
        createdBy: 'Jean Comptable', createdAt: '2026-11-20',
    },
    {
        id: 'an4', code: 'ANA-MKT-Q2', nom: 'Marketing Digital Q2', type: 'ANALYTIQUE',
        montantAlloue: 4500000, parentNom: 'Budget Q2 2026',
        axeLibelles: 'Marketing Digital',
        dateDebut: '2026-04-01', dateFin: '2026-06-30', seuilAlerte: 80,
        createdBy: 'Marie Aide-Comptable', createdAt: '2026-03-28',
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeIcons: Record<BudgetType, React.ReactNode> = {
    EXERCICE: <Building2 className="h-4 w-4 text-indigo-500" />,
    PERIODE: <Calendar className="h-4 w-4 text-blue-500" />,
    ANALYTIQUE: <Layers className="h-4 w-4 text-emerald-500" />,
};

const typeColors: Record<BudgetType, string> = {
    EXERCICE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PERIODE: 'bg-blue-50 text-blue-700 border-blue-200',
    ANALYTIQUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const typeLabels: Record<BudgetType, string> = {
    EXERCICE: 'Exercice',
    PERIODE: 'Période',
    ANALYTIQUE: 'Analytique',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetValidationPage() {
    const [brouillons, setBrouillons] = useState<BudgetBrouillon[]>(MOCK_BROUILLONS);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [previewBudget, setPreviewBudget] = useState<BudgetBrouillon | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; budget: BudgetBrouillon | null }>({ open: false, budget: null });
    const [rejectReason, setRejectReason] = useState('');

    const filtered = brouillons.filter(b =>
        b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(b => b.id)));
        }
    };

    const handleValidate = (id: string) => {
        setBrouillons(prev => prev.filter(b => b.id !== id));
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        toast.success('Budget validé', { description: `Le budget a été validé avec succès.` });
    };

    const handleValidateSelected = () => {
        const count = selectedIds.size;
        setBrouillons(prev => prev.filter(b => !selectedIds.has(b.id)));
        setSelectedIds(new Set());
        toast.success(`${count} budget(s) validé(s)`, { description: 'Tous les budgets sélectionnés ont été validés.' });
    };

    const handleReject = () => {
        if (!rejectDialog.budget) return;
        if (!rejectReason.trim()) {
            toast.error('Veuillez saisir un motif de rejet');
            return;
        }
        setBrouillons(prev => prev.filter(b => b.id !== rejectDialog.budget!.id));
        setSelectedIds(prev => { const next = new Set(prev); next.delete(rejectDialog.budget!.id); return next; });
        toast.info('Budget rejeté', { description: `Motif : ${rejectReason}` });
        setRejectDialog({ open: false, budget: null });
        setRejectReason('');
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => { setBrouillons([...MOCK_BROUILLONS]); setSelectedIds(new Set()); setIsLoading(false); }, 800);
    };

    return (
        <PermissionGuard
            feature="budgets"
            action="lock"
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center space-y-4 p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md">
                        <div className="p-4 bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                            <ShieldCheck className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Accès refusé</h2>
                        <p className="text-sm text-gray-500">
                            La validation des budgets est réservée au Responsable comptable.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="min-h-screen p-6 bg-gray-50/50">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Validation des Budgets</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Examinez et validez les budgets en attente soumis par les comptables et aides-comptables.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-bold text-amber-700">{brouillons.length} en attente</span>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Rechercher par nom, code, créateur..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 border-gray-200"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleRefresh} className="border-gray-200">
                                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                </Button>
                                {selectedIds.size > 0 && (
                                    <Button
                                        size="sm"
                                        onClick={handleValidateSelected}
                                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                        Valider {selectedIds.size} sélectionné(s)
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <CheckCircle className="h-12 w-12 text-green-300 mb-4" />
                                <p className="text-lg font-semibold text-gray-600">Aucun budget en attente</p>
                                <p className="text-sm text-gray-400 mt-1">Tous les budgets ont été traités.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-10 py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === filtered.length && filtered.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300"
                                            />
                                        </TableHead>
                                        <TableHead className="py-3 px-4">Budget</TableHead>
                                        <TableHead className="py-3 px-4">Type</TableHead>
                                        <TableHead className="py-3 px-4">Parent</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Montant (XAF)</TableHead>
                                        <TableHead className="py-3 px-4">Période</TableHead>
                                        <TableHead className="py-3 px-4">Créé par</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((budget) => (
                                        <TableRow
                                            key={budget.id}
                                            className={cn(
                                                "hover:bg-gray-50 border-b border-gray-100 transition-colors",
                                                selectedIds.has(budget.id) && "bg-blue-50/40"
                                            )}
                                        >
                                            <TableCell className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(budget.id)}
                                                    onChange={() => toggleSelect(budget.id)}
                                                    className="rounded border-gray-300"
                                                />
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {typeIcons[budget.type]}
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{budget.nom}</p>
                                                        <p className="text-xs text-gray-400 font-mono">{budget.code}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <Badge variant="outline" className={cn("text-xs", typeColors[budget.type])}>
                                                    {typeLabels[budget.type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-sm text-gray-500">
                                                {budget.parentNom ?? <span className="text-gray-300 italic">—</span>}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right font-mono text-sm font-semibold text-gray-800">
                                                {budget.montantAlloue.toLocaleString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-xs text-gray-500">
                                                {budget.dateDebut} → {budget.dateFin}
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div>
                                                    <p className="text-sm text-gray-700">{budget.createdBy}</p>
                                                    <p className="text-xs text-gray-400">{budget.createdAt}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => setPreviewBudget(budget)}
                                                        className="h-7 px-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                                                        title="Aperçu"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => handleValidate(budget.id)}
                                                        className="h-7 px-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs gap-1"
                                                        title="Valider"
                                                    >
                                                        <CheckCircle className="h-3 w-3" /> Valider
                                                    </Button>
                                                    <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => { setRejectDialog({ open: true, budget }); setRejectReason(''); }}
                                                        className="h-7 px-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs gap-1"
                                                        title="Rejeter"
                                                    >
                                                        <XCircle className="h-3 w-3" /> Rejeter
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialog aperçu */}
            <Dialog open={!!previewBudget} onOpenChange={() => setPreviewBudget(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {previewBudget && typeIcons[previewBudget.type]}
                            {previewBudget?.nom}
                        </DialogTitle>
                        <DialogDescription>Détails du budget en attente de validation</DialogDescription>
                    </DialogHeader>
                    {previewBudget && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-xs text-gray-400 uppercase font-bold">Code</p><p className="font-mono font-bold">{previewBudget.code}</p></div>
                                <div><p className="text-xs text-gray-400 uppercase font-bold">Type</p>
                                    <Badge variant="outline" className={cn("text-xs", typeColors[previewBudget.type])}>{typeLabels[previewBudget.type]}</Badge>
                                </div>
                                {previewBudget.parentNom && (
                                    <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-bold">Budget parent</p><p>{previewBudget.parentNom}</p></div>
                                )}
                                {previewBudget.axeLibelles && (
                                    <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-bold">Axes analytiques</p><p className="text-emerald-700">{previewBudget.axeLibelles}</p></div>
                                )}
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Montant alloué</p>
                                    <p className="text-2xl font-black text-blue-700 font-mono">{previewBudget.montantAlloue.toLocaleString('fr-FR')} XAF</p>
                                </div>
                                <div><p className="text-xs text-gray-400 uppercase font-bold">Période</p><p>{previewBudget.dateDebut} → {previewBudget.dateFin}</p></div>
                                <div><p className="text-xs text-gray-400 uppercase font-bold">Seuil alerte</p><p>{previewBudget.seuilAlerte}%</p></div>
                                {previewBudget.responsable && (
                                    <div><p className="text-xs text-gray-400 uppercase font-bold">Responsable</p><p>{previewBudget.responsable}</p></div>
                                )}
                                <div><p className="text-xs text-gray-400 uppercase font-bold">Créé par</p><p>{previewBudget.createdBy}</p></div>
                                <div><p className="text-xs text-gray-400 uppercase font-bold">Date création</p><p>{previewBudget.createdAt}</p></div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setPreviewBudget(null)}>Fermer</Button>
                        <Button
                            onClick={() => { if (previewBudget) { handleValidate(previewBudget.id); setPreviewBudget(null); } }}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            <CheckCircle className="h-4 w-4" /> Valider ce budget
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog rejet */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, budget: null })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-700">
                            <XCircle className="h-5 w-5" /> Rejeter le budget
                        </DialogTitle>
                        <DialogDescription>
                            Budget : <strong>{rejectDialog.budget?.nom}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-sm text-gray-600">Veuillez indiquer le motif du rejet. Ce motif sera communiqué au créateur du budget.</p>
                        <Textarea
                            placeholder="Ex: Le montant alloué dépasse le plafond de la période parente. Veuillez revoir le montant."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            className="border-gray-200 resize-none"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, budget: null })}>Annuler</Button>
                        <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                            <XCircle className="h-4 w-4" /> Confirmer le rejet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PermissionGuard>
    );
}
