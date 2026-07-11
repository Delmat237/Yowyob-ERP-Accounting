"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { fetchWithOfflineCache, readCachedList } from '@/lib/offline/fetch-with-cache';
import { CG_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { isClientOffline } from '@/lib/offline/network-status';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';
import { ensureLocalId } from '@/lib/offline/ensure-local-id';
import { upsertListItemWithOutbox } from '@/lib/offline/list-outbox-mutations';
import { getPeriodeComptableCourante, triPeriodesComptablesParCode } from '@/lib/accounting/periode-utilisateur';
import { closePeriodeComptableAndAdvance } from '@/lib/accounting/periode-cloture';
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
    const [usingCache, setUsingCache] = useState(false);
    const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

    const { onOpen, onClose: closeCompose } = useCompose();

    const periodesTriees = useMemo(
        () => triPeriodesComptablesParCode(periodes),
        [periodes],
    );

    const periodeCourante = useMemo(
        () => getPeriodeComptableCourante(periodes),
        [periodes],
    );

    const fetchPeriodes = useCallback(async (options?: AutoRefreshOptions) => {
        if (isClientOffline()) {
            const cached = await readCachedList<PeriodeComptableDto[]>(CG_CACHE_KEYS.PERIODES, []);
            if (cached.cachedAt) {
                setPeriodes(cached.data);
                setUsingCache(true);
                setCacheTimestamp(cached.cachedAt);
                setError(null);
                if (!options?.silent) setIsLoading(false);
                return;
            }
        }

        if (!options?.silent) setIsLoading(true);
        setError(null);
        try {
            const result = await fetchWithOfflineCache({
                cacheKey: CG_CACHE_KEYS.PERIODES,
                fetcher: () => AccountingPeriodsService.getAllPeriodeComptables(),
                emptyValue: [] as PeriodeComptableDto[],
            });
            setPeriodes(result.data);
            setUsingCache(result.fromCache);
            setCacheTimestamp(result.cachedAt);
            if (result.fromCache) setError(null);
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
            const result = await fetchWithOfflineCache({
                cacheKey: CG_CACHE_KEYS.EXERCICES,
                fetcher: () => AccountingFiscalYearsService.getAllExercices(),
                emptyValue: [] as ExerciceComptableDto[],
            });
            setExercices(result.data);
            if (result.fromCache) {
                setUsingCache(true);
                setCacheTimestamp((prev) => prev ?? result.cachedAt);
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

    useEffect(() => {
        const visible = periodeCourante;
        if (!visible?.id) return;
        if (viewMode === 'list') {
            setSelectedPeriodeId(visible.id);
        }
        if (viewMode === 'detail' && viewData?.id && viewData.cloturee) {
            setViewData(visible);
            setSelectedPeriodeId(visible.id);
        }
    }, [periodeCourante, viewMode, viewData?.id, viewData?.cloturee]);

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
                const item: PeriodeComptableDto = { ...data, id: data.id };
                await upsertListItemWithOutbox({
                    cacheKey: CG_CACHE_KEYS.PERIODES,
                    entity: 'cg.periodes',
                    action: 'UPDATE',
                    item,
                    onlineMutator: () =>
                        AccountingPeriodsService.updatePeriodeComptable(item.id!, item),
                });
                toast.success('Période mise à jour avec succès');
            } else {
                const item: PeriodeComptableDto = {
                    ...data,
                    id: ensureLocalId(),
                };
                await upsertListItemWithOutbox({
                    cacheKey: CG_CACHE_KEYS.PERIODES,
                    entity: 'cg.periodes',
                    action: 'CREATE',
                    item,
                    onlineMutator: () => AccountingPeriodsService.createPeriodeComptable(item),
                });
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
            const { periodes: updated, nextPeriode } = await closePeriodeComptableAndAdvance(closeId, periodes);
            setPeriodes(updated);
            setViewMode('list');
            setViewData(null);
            if (nextPeriode?.id) {
                setSelectedPeriodeId(nextPeriode.id);
                toast.success('Période clôturée', {
                    description: nextPeriode.cloturee
                        ? undefined
                        : `La période ${nextPeriode.code} est maintenant visible.`,
                });
            } else {
                toast.success('Période clôturée avec succès');
            }
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
                    <p className="text-sm text-gray-500">
                        Gérez toutes les périodes comptables. La période courante est mise en évidence pour les opérations.
                    </p>
                </div>

                <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />

                {error && (
                    <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <PeriodeComptableListView
                    periodes={periodesTriees}
                    exercices={exercices}
                    isLoading={isLoading}
                    onSelectPeriode={handleSelectPeriode}
                    onEditPeriode={handleEditPeriode}
                    onClosePeriode={confirmClose}
                    onAddNew={handleAddNew}
                    selectedId={selectedPeriodeId || periodeCourante?.id || undefined}
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
