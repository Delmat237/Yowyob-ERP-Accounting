"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AccountingEntriesService } from '@/src/lib2/services/AccountingEntriesService';
import { EcritureComptableDto } from '@/src/lib2/models/EcritureComptableDto';
import { AccountingJournalManagementService } from '@/src/lib2/services/AccountingJournalManagementService';
import { AccountingPlanComptableService } from '@/src/lib2/services/AccountingPlanComptableService';
import { JournalComptableDto } from '@/src/lib2/models/JournalComptableDto';
import { EcritureComptableReadView } from '@/components/accounting/ecriture-comptable-read-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useCompose } from '@/hooks/use-compose-store';
import { EcritureComptableDetailView } from '@/components/accounting/ecriture-comptable-detail-view';
import { PermissionGuard } from '@/components/auth/permission-guard';
import {
  saveEcritureComptableOffline,
  validateEcritureComptableOffline,
  deleteEcritureComptableOffline,
} from '@/lib/offline/cg-ecritures-offline';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { CG_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { getCachedList } from '@/lib/offline/list-cache';
import { isOfflineClientId } from '@/lib/offline/id-map';
import { toast } from 'sonner';

export default function EcritureComptableDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [ecriture, setEcriture] = useState<EcritureComptableDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [ecritureToDelete, setEcritureToDelete] = useState<EcritureComptableDto | null>(null);
    const { onOpen, onClose } = useCompose();

    const fetchEcriture = async () => {
        setIsLoading(true);
        try {
            if (isOfflineClientId(id)) {
                const cached = await getCachedList<EcritureComptableDto[]>(CG_CACHE_KEYS.ECRITURES);
                const entry = cached?.data.find((e) => e.id === id);
                if (entry) {
                    setEcriture(entry);
                    return;
                }
            }

            const [entryRes, journalsRes, accountsRes] = await Promise.all([
                fetchWithOfflineCache({
                    cacheKey: `cg.ecriture.${id}`,
                    fetcher: () => AccountingEntriesService.getById(id),
                    emptyValue: null as EcritureComptableDto | null,
                }),
                fetchWithOfflineCache({
                    cacheKey: CG_CACHE_KEYS.JOURNAUX,
                    fetcher: () => AccountingJournalManagementService.getAllJournals(),
                    emptyValue: [] as JournalComptableDto[],
                }),
                fetchWithOfflineCache({
                    cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
                    fetcher: () => AccountingPlanComptableService.getAllPlanComptables(),
                    emptyValue: [] as import('@/src/lib2/models/PlanComptableDto').PlanComptableDto[],
                }),
            ]);

            const entry = entryRes.data;
            if (entry) {
                const journals = journalsRes.data;
                const accounts = accountsRes.data;

                if (!entry.journalComptableLibelle) {
                    const journal = journals.find((j) => j.id === entry.journalComptableId);
                    if (journal) entry.journalComptableLibelle = journal.libelle;
                }

                if (entry.detailsEcriture) {
                    entry.detailsEcriture = entry.detailsEcriture.map((detail) => {
                        const acc = accounts.find((a) => a.id === detail.compteComptableId);
                        return {
                            ...detail,
                            compteComptableNo: acc?.noCompte || detail.compteComptableId,
                        } as typeof detail;
                    });
                }

                setEcriture(entry);
            } else {
                router.push('/accounting/entries');
            }
        } catch (error) {
            console.error("Failed to fetch ecriture details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchEcriture();
        }
    }, [id]);

    const handleSave = async (data: EcritureComptableDto) => {
        try {
            const { queued } = await saveEcritureComptableOffline(data);
            onClose();
            await fetchEcriture();
            if (queued) {
                toast.success("Modification enregistrée localement");
            }
        } catch (error) {
            console.error("Failed to update ecriture:", error);
        }
    };

    const handleValidate = async (validateId: string) => {
        try {
            const { queued } = await validateEcritureComptableOffline(validateId);
            onClose();
            await fetchEcriture();
            toast.success(queued ? "Validation en attente de synchronisation" : "Écriture validée");
        } catch (error) {
            console.error("Failed to validate:", error);
        }
    };

    const confirmDelete = async () => {
        if (!ecritureToDelete?.id) return;
        try {
            const { queued } = await deleteEcritureComptableOffline(ecritureToDelete.id);
            if (queued) {
                toast.success("Suppression en attente de synchronisation");
            }
            router.push('/accounting/entries');
        } catch (error) {
            console.error("Failed to delete:", error);
        } finally {
            setEcritureToDelete(null);
        }
    };

    const handleEdit = () => {
        if (!ecriture) return;
        onOpen({
            title: "Modifier l'Écriture Comptable",
            content: (
                <EcritureComptableDetailView
                    ecriture={ecriture}
                    onSave={handleSave}
                    onDelete={() => {
                        setEcritureToDelete(ecriture);
                        onClose();
                    }}
                    onBack={onClose}
                />
            )
        });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Chargement des détails...</div>;
    }

    if (!ecriture) {
        return <div className="p-8 text-center text-red-500">Ecriture introuvable.</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
            <div className="flex items-center justify-between">
                <div />

                {!ecriture.validee && (
                    <div className="flex gap-2">
                        <PermissionGuard feature="journal_entries" action="update">
                            <Button variant="outline" onClick={handleEdit} className="text-blue-600 border-blue-200 bg-blue-50">
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard feature="journal_entries" action="delete">
                            <Button variant="destructive" onClick={() => setEcritureToDelete(ecriture)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </Button>
                        </PermissionGuard>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <EcritureComptableReadView ecriture={ecriture} />
            </div>

            <div className="flex justify-end pt-6 border-t font-semibold">
                <Button
                    variant="outline"
                    onClick={() => router.push('/accounting/entries')}
                    className="bg-white hover:bg-gray-50 text-gray-800 border-gray-300 px-10 font-semibold shadow-sm"
                >
                    Fermer
                </Button>
            </div>

            {ecritureToDelete && (
                <ConfirmationDialog
                    isOpen={!!ecritureToDelete}
                    onClose={() => setEcritureToDelete(null)}
                    onConfirm={confirmDelete}
                    title={`Supprimer ${ecritureToDelete.libelle} ?`}
                    description="Cette action est irréversible."
                />
            )}
        </div>
    );
}
