"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
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
    CheckCircle, XCircle, Search, ShieldCheck,
    Building2, Calendar, Layers, AlertTriangle, Eye, CheckCheck, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { cn } from '@/lib/utils';
import type { BudgetItem, BudgetType } from '@/components/accounting/budget-list-view';
import { AccountingBudgetsService } from '@/src/lib2/services/AccountingBudgetsService';
import { isBudgetBrouillon, mapBudgetDtoToItem } from '@/lib/accounting/budget-mappers';

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

export default function BudgetValidationPage() {
    const [brouillons, setBrouillons] = useState<BudgetItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [previewBudget, setPreviewBudget] = useState<BudgetItem | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; budget: BudgetItem | null }>({
        open: false,
        budget: null,
    });
    const [rejectReason, setRejectReason] = useState('');
    const [validatingId, setValidatingId] = useState<string | null>(null);

    const loadBrouillons = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) setIsLoading(true);
        try {
            const response = await AccountingBudgetsService.getAllBudgets();
            const drafts = (response.data ?? [])
                .filter(isBudgetBrouillon)
                .map(mapBudgetDtoToItem);
            setBrouillons(drafts);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Failed to load draft budgets:', error);
            toast.error('Impossible de charger les budgets en brouillon.');
        } finally {
            if (!options?.silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBrouillons();
    }, [loadBrouillons]);

    useAutoRefresh(loadBrouillons, [loadBrouillons]);

    const filtered = brouillons.filter((b) =>
        b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.responsable ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map((b) => b.id)));
        }
    };

    const removeFromList = (id: string) => {
        setBrouillons((prev) => prev.filter((b) => b.id !== id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const handleValidate = async (id: string) => {
        setValidatingId(id);
        try {
            await AccountingBudgetsService.validateBudget(id);
            removeFromList(id);
            toast.success('Budget validé', {
                description: 'Le budget n\'est plus en brouillon et peut être activé depuis le suivi budgétaire.',
            });
        } catch (error) {
            console.error('Failed to validate budget:', error);
            toast.error('Impossible de valider ce budget.');
        } finally {
            setValidatingId(null);
        }
    };

    const handleValidateSelected = async () => {
        const ids = [...selectedIds];
        if (ids.length === 0) return;

        setIsLoading(true);
        let success = 0;
        for (const id of ids) {
            try {
                await AccountingBudgetsService.validateBudget(id);
                success += 1;
            } catch (error) {
                console.error(`Failed to validate budget ${id}:`, error);
            }
        }
        await loadBrouillons();
        if (success > 0) {
            toast.success(`${success} budget(s) validé(s)`);
        }
        if (success < ids.length) {
            toast.error(`${ids.length - success} validation(s) ont échoué.`);
        }
    };

    const handleReject = async () => {
        if (!rejectDialog.budget) return;
        if (!rejectReason.trim()) {
            toast.error('Veuillez saisir un motif de rejet');
            return;
        }

        const budget = rejectDialog.budget;
        try {
            await AccountingBudgetsService.deleteBudget(budget.id);
            removeFromList(budget.id);
            toast.info('Budget rejeté et supprimé', { description: `Motif : ${rejectReason}` });
            setRejectDialog({ open: false, budget: null });
            setRejectReason('');
        } catch (error) {
            console.error('Failed to reject budget:', error);
            toast.error('Impossible de rejeter ce budget.');
        }
    };

    if (isLoading && brouillons.length === 0) {
        return <CustomPageLoader message="Chargement des brouillons..." />;
    }

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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Validation des Budgets</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Validez les budgets créés en brouillon par les comptables (CU-B03). Toute création démarre à l&apos;état <strong>BROUILLON</strong>.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-bold text-amber-700">{brouillons.length} en attente</span>
                            </div>
                        </div>
                    </div>

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
                                {selectedIds.size > 0 && (
                                    <Button
                                        size="sm"
                                        onClick={handleValidateSelected}
                                        disabled={isLoading}
                                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                        Valider {selectedIds.size} sélectionné(s)
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <CheckCircle className="h-12 w-12 text-green-300 mb-4" />
                                <p className="text-lg font-semibold text-gray-600">Aucun budget en brouillon</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Les nouveaux budgets apparaissent ici jusqu&apos;à validation par le responsable.
                                </p>
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
                                            <TableCell className="py-3 px-4 text-sm text-gray-700">
                                                {budget.responsable ?? '—'}
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
                                                        disabled={validatingId === budget.id}
                                                        className="h-7 px-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs gap-1"
                                                        title="Valider"
                                                    >
                                                        {validatingId === budget.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-3 w-3" />
                                                        )}
                                                        Valider
                                                    </Button>
                                                    <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => {
                                                            setRejectDialog({ open: true, budget });
                                                            setRejectReason('');
                                                        }}
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

            <Dialog open={!!previewBudget} onOpenChange={() => setPreviewBudget(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {previewBudget && typeIcons[previewBudget.type]}
                            {previewBudget?.nom}
                        </DialogTitle>
                        <DialogDescription>Budget en brouillon — en attente de validation</DialogDescription>
                    </DialogHeader>
                    {previewBudget && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Code</p>
                                    <p className="font-mono font-bold">{previewBudget.code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Statut</p>
                                    <Badge className="bg-yellow-100 text-yellow-800">BROUILLON</Badge>
                                </div>
                                {previewBudget.parentNom && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Budget parent</p>
                                        <p>{previewBudget.parentNom}</p>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Montant alloué</p>
                                    <p className="text-2xl font-black text-blue-700 font-mono">
                                        {previewBudget.montantAlloue.toLocaleString('fr-FR')} XAF
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Période</p>
                                    <p>{previewBudget.dateDebut} → {previewBudget.dateFin}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Seuil alerte</p>
                                    <p>{previewBudget.seuilAlerte}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setPreviewBudget(null)}>Fermer</Button>
                        <Button
                            onClick={() => {
                                if (previewBudget) {
                                    handleValidate(previewBudget.id);
                                    setPreviewBudget(null);
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            <CheckCircle className="h-4 w-4" /> Valider ce budget
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, budget: null })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-700">
                            <XCircle className="h-5 w-5" /> Rejeter le budget
                        </DialogTitle>
                        <DialogDescription>
                            Budget : <strong>{rejectDialog.budget?.nom}</strong> — le brouillon sera supprimé.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-sm text-gray-600">
                            Indiquez le motif du rejet. Le créateur devra soumettre un nouveau budget.
                        </p>
                        <Textarea
                            placeholder="Ex: Le montant dépasse le plafond de la période parente."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            className="border-gray-200 resize-none"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, budget: null })}>
                            Annuler
                        </Button>
                        <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                            <XCircle className="h-4 w-4" /> Confirmer le rejet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PermissionGuard>
    );
}
