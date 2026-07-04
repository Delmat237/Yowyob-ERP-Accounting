"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { ExerciceComptableDto } from '@/src/lib2/models/ExerciceComptableDto';
import { AccountingFiscalYearsService } from '@/src/lib2/services/AccountingFiscalYearsService';
import { ExerciceComptableListView } from '@/components/accounting/exercice-comptable-list-view';
import { ExerciceComptableDetailView } from '@/components/accounting/exercice-comptable-detail-view';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
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

export default function FiscalYearsPage() {
    const [exercices, setExercices] = useState<ExerciceComptableDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExerciceId, setSelectedExerciceId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [closeId, setCloseId] = useState<string | null>(null);

    const { onOpen, onClose: closeCompose } = useCompose();

    const fetchExercices = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) setIsLoading(true);
        setError(null);
        try {
            const response = await AccountingFiscalYearsService.getAllExercices();
            if (response && response.data) {
                setExercices(response.data);
            } else {
                setExercices([]);
            }
        } catch (err: any) {
            let reason = "Impossible de charger les exercices.";
            if (err.body?.message) reason = err.body.message;
            else if (err.message) reason = err.message;

            console.error("Failed to fetch fiscal years:", err);
            toast.error('Erreur lors du chargement', {
                description: reason,
                className: "bg-red-50 border-red-200 text-red-800"
            });
            setError('Impossible de charger les exercices comptables. Veuillez vérifier votre connexion internet.');
        } finally {
            if (!options?.silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchExercices();
    }, [fetchExercices]);

    useAutoRefresh(fetchExercices, [fetchExercices]);

    const handleSave = async (data: ExerciceComptableDto) => {
        try {
            if (data.id) {
                await AccountingFiscalYearsService.updateExercice(data.id, data);
                toast.success('Exercice mis à jour avec succès', {
                    description: `L'exercice ${data.code} a été modifié.`,
                    className: "bg-green-50 border-green-200 text-green-800"
                });
            } else {
                await AccountingFiscalYearsService.createExercice(data);
                toast.success('Exercice créé avec succès', {
                    description: `Le nouvel exercice ${data.code} a été ajouté.`,
                    className: "bg-green-50 border-green-200 text-green-800"
                });
            }
            await fetchExercices();
            setSelectedExerciceId(null);
        } catch (err: any) {
            let reason = "Une erreur inattendue est survenue.";
            if (err.body?.message) reason = err.body.message;
            else if (err.message) reason = err.message;

            toast.error("Erreur lors de l'enregistrement", {
                description: reason,
                className: "bg-red-50 border-red-200 text-red-800"
            });
        }
    };

    const confirmClose = (id: string) => {
        setCloseId(id);
    };

    const handleCloseExercice = async () => {
        if (!closeId) return;

        try {
            await AccountingFiscalYearsService.closeExercice(closeId);
            toast.success('Exercice clôturé', {
                description: "L'exercice a été clôturé avec succès.",
                className: "bg-green-50 border-green-200 text-green-800"
            });
            await fetchExercices();
        } catch (err: any) {
            let reason = "Impossible de clôturer cet exercice.";
            if (err.body?.message) reason = err.body.message;
            else if (err.message) reason = err.message;

            toast.error("Erreur de clôture", {
                description: reason,
                className: "bg-red-50 border-red-200 text-red-800"
            });
        } finally {
            setCloseId(null);
        }
    };

    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [viewData, setViewData] = useState<ExerciceComptableDto | null>(null);

    const handleSelectExercice = (id: string) => {
        const exercice = exercices.find(e => e.id === id);
        if (exercice) {
            setViewData(exercice);
            setViewMode('detail');
        }
    };

    const handleEditExercice = (id: string) => {
        const exercice = exercices.find(e => e.id === id);
        if (exercice) handleOpenCompose(exercice, true);
    };

    const handleAddNew = () => {
        handleOpenCompose(null, true);
    };

    const handleOpenCompose = (exercice: ExerciceComptableDto | null = null, isEditing: boolean = false) => {
        onOpen({
            title: isEditing ? (exercice ? "Modifier l'Exercice" : "Nouvel Exercice") : "Détails de l'Exercice",
            content: (
                <ExerciceComptableDetailView
                    exercice={exercice}
                    onSave={async (data) => {
                        await handleSave(data);
                        closeCompose();
                    }}
                    onBack={closeCompose}
                    onClose={() => {
                        if (exercice) confirmClose(exercice.id!);
                        closeCompose();
                    }}
                    forceEdit={isEditing}
                    onEdit={() => {
                        closeCompose();
                        handleOpenCompose(exercice, true);
                    }}
                />
            )
        });
    };

    if (viewMode === 'detail' && viewData) {
        return (
            <div className="min-h-screen flex flex-col p-4 bg-gray-100">
                <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    <ExerciceComptableDetailView
                        exercice={viewData}
                        onSave={handleSave}
                        onBack={() => setViewMode('list')}
                        onClose={() => {
                            if (viewData.id) confirmClose(viewData.id);
                        }}
                        onEdit={() => handleOpenCompose(viewData, true)}
                    />
                </div>

                <AlertDialog open={!!closeId} onOpenChange={(open) => !open && setCloseId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                La clôture d'un exercice est une opération importante.
                                Assurez-vous d'avoir vérifié toutes les écritures avant de procéder.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCloseExercice} className="bg-orange-600 hover:bg-orange-700">
                                Clôturer l'exercice
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4 bg-gray-100">
            <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-1">Exercices Comptables</h2>
                    <p className="text-sm text-gray-500">Gérez les périodes d'activité de votre entreprise et leurs clôtures.</p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <ExerciceComptableListView
                    exercices={exercices}
                    isLoading={isLoading}
                    onSelectExercice={handleSelectExercice}
                    onEditExercice={handleEditExercice}
                    onCloseExercice={confirmClose}
                    onAddNew={handleAddNew}
                    selectedId={selectedExerciceId || undefined}
                />

                <AlertDialog open={!!closeId} onOpenChange={(open) => !open && setCloseId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                La clôture d'un exercice est une opération importante.
                                Assurez-vous d'avoir vérifié toutes les écritures avant de procéder.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCloseExercice} className="bg-orange-600 hover:bg-orange-700">
                                Clôturer l'exercice
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
