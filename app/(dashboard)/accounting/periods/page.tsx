"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { AccountingPeriodsService } from '@/src/lib2/services/AccountingPeriodsService';
import { PeriodeComptableDto } from '@/src/lib2/models/PeriodeComptableDto';
import { ExerciceComptableDto } from '@/src/lib2/models/ExerciceComptableDto';
import { AccountingFiscalYearsService } from '@/src/lib2/services/AccountingFiscalYearsService';
import { PeriodeComptableListView } from '@/components/accounting/periode-comptable-list-view';
import { PeriodeComptableDetailView } from '@/components/accounting/periode-comptable-detail-view';
import { PeriodeComptableReadView } from '@/components/accounting/periode-comptable-read-view';
import { toast } from 'sonner';
import { AlertCircle, Edit, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCompose } from '@/hooks/use-compose-store';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PeriodsPage() {
    const [periodes, setPeriodes] = useState<PeriodeComptableDto[]>([]);
    const [exercices, setExercices] = useState<ExerciceComptableDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [closeId, setCloseId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [viewData, setViewData] = useState<PeriodeComptableDto | null>(null);

    const { onOpen, onClose: closeCompose } = useCompose();

    const fetchPeriodes = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) setIsLoading(true);
        setError(null);
        try {
            const response = await AccountingPeriodsService.getAllPeriodeComptables();
            if (response && response.data) {
                setPeriodes(response.data);
            } else {
                setPeriodes([]);
            }
        } catch (err: any) {
            let reason = "Impossible de charger les périodes.";
            if (err.body?.message) reason = err.body.message;
            else if (err.message) reason = err.message;

            console.error('Error fetching periods:', err);
            setError('Impossible de charger les périodes comptables. Veuillez vérifier votre connexion au serveur.');
            toast.error('Erreur lors du chargement', { description: reason });
        } finally {
            if (!options?.silent) setIsLoading(false);
        }
    }, []);

    const fetchExercices = useCallback(async () => {
        try {
            const response = await AccountingFiscalYearsService.getAllExercices();
            if (response && response.data) {
                setExercices(response.data);
            }
        } catch (err) {
            console.error('Error fetching exercices:', err);
        }
    }, []);

    const loadPeriodsData = useCallback(async (options?: AutoRefreshOptions) => {
        await Promise.all([fetchPeriodes(options), fetchExercices()]);
    }, [fetchPeriodes, fetchExercices]);

    useEffect(() => {
        void loadPeriodsData();
    }, [loadPeriodsData]);

    useAutoRefresh(loadPeriodsData, [loadPeriodsData]);

    const handleSave = async (data: PeriodeComptableDto) => {
        try {
            // Business rule: only one period can be open at a time
            if (!data.cloturee) {
                const otherOpen = periodes.find(p => !p.cloturee && p.id !== data.id);
                if (otherOpen) {
                    toast.error("Impossible d'ouvrir cette période", {
                        description: `La période ${otherOpen.code} est déjà ouverte. Vous devez la clôturer avant d'en ouvrir une autre.`
                    });
                    return;
                }
            }

            if (data.id) {
                await AccountingPeriodsService.updatePeriodeComptable(data.id, data);
                toast.success('Période mise à jour avec succès');
            } else {
                await AccountingPeriodsService.createPeriodeComptable(data);
                toast.success('Période créée avec succès');
            }
            await fetchPeriodes();
            setSelectedPeriodeId(null);
        } catch (err: any) {
            let reason = "Une erreur inattendue est survenue.";
            if (err.body?.message) reason = err.body.message;
            else if (err.message) reason = err.message;

            toast.error("Erreur lors de l'enregistrement", { description: reason });
        }
    };

    const confirmClose = (id: string) => {
        setCloseId(id);
    };

    const handleClosePeriode = async () => {
        if (!closeId) return;

        try {
            await AccountingPeriodsService.closePeriodeComptable(closeId);
            toast.success('Période clôturée avec succès');
            await fetchPeriodes();
        } catch (err: any) {
            let reason = "Impossible de clôturer.";
            if (err.body?.message) reason = err.body.message;
            else if (err.message) reason = err.message;

            toast.error("Erreur de clôture", { description: reason });
        } finally {
            setCloseId(null);
        }
    };

    const handleSelectPeriode = (id: string) => {
        const periode = periodes.find(p => p.id === id);
        if (periode) {
            setViewData(periode);
            setViewMode('detail');
            setSelectedPeriodeId(id);
        }
    };

    const handleEditPeriode = (id: string) => {
        const periode = periodes.find(p => p.id === id);
        if (periode) handleOpenCompose(periode, true);
    };

    const handleAddNew = () => {
        handleOpenCompose(null, true);
    };

    const handleOpenCompose = (periode: PeriodeComptableDto | null = null, isEditing: boolean = false) => {
        onOpen({
            title: periode ? "Modifier la Période" : "Nouvelle Période",
            isMaximized: false,
            content: (
                <PeriodeComptableDetailView
                    periode={periode}
                    onSave={async (data) => {
                        await handleSave(data);
                        closeCompose();
                    }}
                    onClose={closeCompose}
                    onBack={closeCompose}
                    onConfirmClose={confirmClose}
                />
            )
        });
    };

    if (viewMode === 'detail' && viewData) {
        const exercice = exercices.find(ex => ex.id === viewData.exercice_id);
        const exerciceCode = exercice ? exercice.code : "-";

        return (
            <div className="min-h-screen flex flex-col p-4 bg-gray-100">
                <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-8 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight uppercase">Détails de Période</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            {!viewData.cloturee && (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                                        onClick={() => handleEditPeriode(viewData.id!)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-orange-600 hover:bg-orange-50 h-8 w-8 p-0"
                                        onClick={() => confirmClose(viewData.id!)}
                                    >
                                        <Lock className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <PeriodeComptableReadView
                        periode={viewData}
                        exerciceCode={exerciceCode}
                        onBack={() => setViewMode('list')}
                    />
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col p-4 bg-gray-100">
            <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-1">Périodes Comptables</h2>
                    <p className="text-sm text-gray-500">Gérez les périodes comptables (mois) pour chaque exercice.</p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <PeriodeComptableListView
                    periodes={periodes}
                    exercices={exercices}
                    isLoading={isLoading}
                    onSelectPeriode={handleSelectPeriode}
                    onEditPeriode={handleEditPeriode}
                    onClosePeriode={confirmClose}
                    onAddNew={handleAddNew}
                    selectedId={selectedPeriodeId || undefined}
                />

                <AlertDialog open={!!closeId} onOpenChange={(open) => !open && setCloseId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Voulez-vous vraiment clôturer cette période ? Cette action peut être irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClosePeriode} className="bg-orange-600 hover:bg-orange-700">
                                Clôturer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
