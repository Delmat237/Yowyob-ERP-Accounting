"use client";

/* eslint-disable react/no-unescaped-entities */
import React, { useCallback, useEffect, useState } from 'react';
import { AnalyticsListView, AxeAnalytique } from '@/components/accounting/analytics-list-view';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCompose } from '@/hooks/use-compose-store';
import { AxeForm } from '@/components/accounting/axe-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Tag, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/src/lib/auth/roles';
import { AccountingAnalyticsService } from '@/src/lib2/services/AccountingAnalyticsService';
import { AxeAnalytiqueDto } from '@/src/lib2/models/AxeAnalytiqueDto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildAxeCode(libelle: string) {
    return libelle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toUpperCase()
        .slice(0, 20) || `AXE-${Date.now().toString().slice(-6)}`;
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

function toAxeDto(data: AxeAnalytique): AxeAnalytiqueDto {
    return {
        code: data.code || buildAxeCode(data.libelle),
        libelle: data.libelle,
        type: data.type,
        responsable: data.responsable,
        actif: data.actif,
        compteIds: data.comptes?.map(c => c.id).filter(id => UUID_PATTERN.test(id)),
    };
}

// ─── Panneau détail d'un axe (inline, pas dans un modal) ─────────────────────
interface AxeDetailPanelProps {
    axe: AxeAnalytique;
    onEdit: () => void;
    onClose: () => void;
    onToggleActif: () => void;
    canToggleActif: boolean;
}

function AxeDetailPanel({ axe, onEdit, onClose, onToggleActif, canToggleActif }: AxeDetailPanelProps) {
    return (
        <div className="w-full md:w-[440px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col h-full overflow-hidden">
            {/* Header du panneau */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                    <h3 className="font-bold text-slate-800 text-base">{axe.libelle}</h3>
                    {axe.code && <p className="text-xs text-slate-400 font-mono mt-0.5">{axe.code}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-slate-700">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Infos principales */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Type</p>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                            {axe.type}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Statut</p>
                        {axe.actif ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs">Actif</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">Inactif</Badge>
                        )}
                    </div>
                    <div className="col-span-2 space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Responsable</p>
                        <p className="text-sm text-slate-700">{axe.responsable || 'Non assigné'}</p>
                    </div>
                </div>

                {/* Toggle actif/inactif */}
                {canToggleActif && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {axe.actif ? 'Désactiver cet axe' : 'Activer cet axe'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {axe.actif
                                        ? 'L\'axe ne sera plus proposé dans les budgets.'
                                        : 'L\'axe sera disponible pour la création de budgets.'}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToggleActif}
                                className={axe.actif
                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50 gap-1.5'
                                    : 'border-green-200 text-green-700 hover:bg-green-50 gap-1.5'}
                            >
                                {axe.actif
                                    ? <><ToggleLeft className="h-4 w-4" /> Désactiver</>
                                    : <><ToggleRight className="h-4 w-4" /> Activer</>}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Comptes analytiques */}
                <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                        <Tag className="h-3 w-3" /> Comptes analytiques liés
                    </p>
                    {axe.comptes && axe.comptes.length > 0 ? (
                        <div className="space-y-2">
                            {axe.comptes.map((compte) => (
                                <div key={compte.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    <span className="text-sm text-slate-700">{compte.libelle}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">Aucun compte analytique lié à cet axe.</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <Button onClick={onEdit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                    <Pencil className="h-4 w-4" /> Modifier cet axe
                </Button>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const [axes, setAxes] = useState<AxeAnalytique[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [axeToDelete, setAxeToDelete] = useState<AxeAnalytique | null>(null);
    const [selectedAxe, setSelectedAxe] = useState<AxeAnalytique | null>(null);
    const { onOpen, onClose: closeCompose } = useCompose();
    const { accountingRole } = useAuth();
    const canToggleActif = hasPermission(accountingRole, 'analytics', 'update');

    const loadAxes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await AccountingAnalyticsService.getAllAxes();
            setAxes((response.data ?? []).map(mapAxeDto));
            setSelectedAxe(null);
        } catch (error) {
            console.error('Failed to load analytical axes:', error);
            toast.error("Impossible de charger les axes analytiques depuis le backend.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAxes();
    }, [loadAxes]);

    const handleRefresh = () => {
        loadAxes();
    };

    const handleAddNew = () => {
        onOpen({
            title: "Nouvel Axe Analytique",
            content: (
                <AxeForm
                    onCancel={closeCompose}
                    onSubmit={async (data) => {
                        try {
                            const response = await AccountingAnalyticsService.createAxe(toAxeDto(data));
                            const newAxe = response.data ? mapAxeDto(response.data) : null;
                            if (newAxe) setAxes(prev => [newAxe, ...prev]);
                            closeCompose();
                            toast.success(`Axe "${data.libelle}" créé`);
                        } catch (error) {
                            console.error('Failed to create analytical axis:', error);
                            toast.error("Impossible de créer l'axe analytique.");
                        }
                    }}
                />
            )
        });
    };

    const openEditForm = (id: string) => {
        const axeToEdit = axes.find(a => a.id === id);
        if (!axeToEdit) return;

        onOpen({
            title: `Mettre à jour l'Axe : ${axeToEdit.libelle}`,
            content: (
                <AxeForm
                    initialData={axeToEdit}
                    onCancel={closeCompose}
                    onSubmit={async (updatedData) => {
                        try {
                            const response = await AccountingAnalyticsService.updateAxe(id, toAxeDto(updatedData));
                            const savedAxe = response.data ? mapAxeDto(response.data) : updatedData;
                            setAxes(prev => prev.map(a => a.id === id ? savedAxe : a));
                            if (selectedAxe?.id === id) setSelectedAxe(savedAxe);
                            closeCompose();
                            toast.success(`Axe "${updatedData.libelle}" mis à jour`);
                        } catch (error) {
                            console.error('Failed to update analytical axis:', error);
                            toast.error("Impossible de mettre à jour l'axe analytique.");
                        }
                    }}
                />
            )
        });
    };

    // Clic sur une ligne → panneau détail inline (pas de modal)
    const handleView = (id: string) => {
        const axe = axes.find(a => a.id === id);
        if (!axe) return;
        setSelectedAxe(axe);
    };

    const handleEdit = (id: string) => {
        openEditForm(id);
    };

    const handleToggleActif = async (id: string) => {
        const axe = axes.find(a => a.id === id);
        if (!axe) return;
        try {
            const response = await AccountingAnalyticsService.updateAxe(id, toAxeDto({ ...axe, actif: !axe.actif }));
            const updatedAxe = response.data ? mapAxeDto(response.data) : { ...axe, actif: !axe.actif };
            setAxes(prev => prev.map(a => a.id === id ? updatedAxe : a));
            if (selectedAxe?.id === id) setSelectedAxe(updatedAxe);
            toast.success(axe.actif ? `Axe "${axe.libelle}" désactivé` : `Axe "${axe.libelle}" activé`);
        } catch (error) {
            console.error('Failed to toggle analytical axis:', error);
            toast.error("Impossible de modifier le statut de l'axe.");
        }
    };

    const handleDelete = async () => {
        if (!axeToDelete) return;
        try {
            await AccountingAnalyticsService.deleteAxe(axeToDelete.id);
            setAxes(prev => prev.filter(a => a.id !== axeToDelete.id));
            if (selectedAxe?.id === axeToDelete.id) setSelectedAxe(null);
            toast.success('Axe supprimé', { description: `"${axeToDelete.libelle}" a été supprimé.` });
            setAxeToDelete(null);
        } catch (error) {
            console.error('Failed to delete analytical axis:', error);
            toast.error("Impossible de supprimer l'axe analytique.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4 bg-gray-100">
            <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-1">Axes Analytiques</h2>
                    <p className="text-sm text-gray-500">
                        Définissez vos centres de coût, projets, départements et activités pour l'imputation analytique.
                    </p>
                </div>

                {/* Layout deux colonnes quand un axe est sélectionné */}
                <div className="flex flex-col lg:flex-row" style={{ minHeight: '500px' }}>
                    {/* Liste */}
                    <div className="flex-1 p-4 md:p-6 overflow-auto">
                        <AnalyticsListView
                            axes={axes}
                            isLoading={isLoading}
                            onEdit={handleEdit}
                            onView={handleView}
                            onDelete={(a) => setAxeToDelete(a)}
                            onAddNew={handleAddNew}
                            onRefresh={handleRefresh}
                        />
                    </div>

                    {/* Panneau détail */}
                    {selectedAxe && (
                        <AxeDetailPanel
                            axe={selectedAxe}
                            onClose={() => setSelectedAxe(null)}
                            onEdit={() => openEditForm(selectedAxe.id)}
                            onToggleActif={() => handleToggleActif(selectedAxe.id)}
                            canToggleActif={canToggleActif}
                        />
                    )}
                </div>
            </div>

            <AlertDialog open={!!axeToDelete} onOpenChange={(open) => !open && setAxeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet axe analytique ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. L'axe analytique "{axeToDelete?.libelle}" sera définitivement supprimé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
