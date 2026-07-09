// app/(dashboard)/accounting/entries/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { EcritureComptableDto } from '@/src/lib2/models/EcritureComptableDto';
import { AccountingEntriesService } from '@/src/lib2/services/AccountingEntriesService';
import { AccountingJournalManagementService } from '@/src/lib2/services/AccountingJournalManagementService';
import { AccountingPlanComptableService } from '@/src/lib2/services/AccountingPlanComptableService';
import { JournalComptableDto } from '@/src/lib2/models/JournalComptableDto';
import { PlanComptableDto } from '@/src/lib2/models/PlanComptableDto';
import { EcritureComptableListView } from '@/components/accounting/ecriture-comptable-list-view';
import { EcritureComptableDetailView } from '@/components/accounting/ecriture-comptable-detail-view';
import { useCompose } from '@/hooks/use-compose-store';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { CG_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';
import {
  saveEcritureComptableOffline,
  validateEcritureComptableOffline,
  deleteEcritureComptableOffline,
  deactivateEcritureComptableOffline,
  mergeServerEcrituresIntoCache,
} from '@/lib/offline/cg-ecritures-offline';
import { getCachedList } from '@/lib/offline/list-cache';
import { isOfflineClientId } from '@/lib/offline/id-map';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from 'sonner';
import { AccountingInvoiceUploadService } from '@/src/lib2/services/AccountingInvoiceUploadService';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EcritureComptablePage() {
  const router = useRouter();
  const [ecritures, setEcritures] = useState<EcritureComptableDto[]>([]);
  const [journals, setJournals] = useState<JournalComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEcritureId, setSelectedEcritureId] = useState<string | null>(null);
  const [ecritureToDelete, setEcritureToDelete] = useState<EcritureComptableDto | null>(null);
  const [ecritureToDeactivate, setEcritureToDeactivate] = useState<EcritureComptableDto | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [accounts, setAccounts] = useState<{ id: string; noCompte: string }[]>([]);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

  const { onOpen, onClose: closeCompose } = useCompose();

  const fetchAndSetEcritures = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    try {
      const [entriesResult, journalsResult, accountsResult] = await Promise.all([
        fetchWithOfflineCache({
          cacheKey: CG_CACHE_KEYS.ECRITURES,
          fetcher: () => AccountingEntriesService.getAll1(),
          emptyValue: [] as EcritureComptableDto[],
        }),
        fetchWithOfflineCache({
          cacheKey: CG_CACHE_KEYS.JOURNAUX,
          fetcher: () => AccountingJournalManagementService.getAllJournals(),
          emptyValue: [] as JournalComptableDto[],
        }),
        fetchWithOfflineCache({
          cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
          fetcher: () => AccountingPlanComptableService.getAllPlanComptables(),
          emptyValue: [] as PlanComptableDto[],
        }),
      ]);

      const fetchedJournals = journalsResult.data;
      setJournals(fetchedJournals);

      const fetchedAccounts = accountsResult.data;
      setAccounts(fetchedAccounts.map((a) => ({ id: a.id!, noCompte: a.noCompte })));

      const mergedEntries = await mergeServerEcrituresIntoCache(entriesResult.data);

      const subbedEntries = mergedEntries.map((entry: EcritureComptableDto) => ({
        ...entry,
        journalComptableLibelle:
          fetchedJournals.find((j: JournalComptableDto) => j.id === entry.journalComptableId)?.libelle ||
          entry.journalComptableId,
      }));

      setEcritures(subbedEntries);

      const fromCache =
        entriesResult.fromCache || journalsResult.fromCache || accountsResult.fromCache;
      setUsingCache(fromCache);
      setCacheTimestamp(
        entriesResult.cachedAt ?? journalsResult.cachedAt ?? accountsResult.cachedAt,
      );
    } catch (error) {
      console.error("Failed to fetch ecritures or journals:", error);
      setEcritures([]);
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAndSetEcritures();
  }, [fetchAndSetEcritures]);

  useAutoRefresh(fetchAndSetEcritures, [fetchAndSetEcritures]);

  const handleSave = async (data: EcritureComptableDto) => {
    const isNew = !data.id;
    try {
      const { queued } = await saveEcritureComptableOffline(data);
      closeCompose();
      await fetchAndSetEcritures();
      if (queued) {
        toast.success("Écriture enregistrée localement", {
          description: "Elle sera synchronisée dès que la connexion sera rétablie.",
        });
      } else {
        toast.success(isNew ? "Écriture créée avec succès" : "Écriture mise à jour avec succès");
      }
    } catch (error: any) {
      console.error("Failed to save ecriture:", error);
      toast.error(`Erreur lors de l'enregistrement: ${error.body?.message || error.message || "Erreur inconnue"}`);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      const { queued } = await validateEcritureComptableOffline(id);
      await fetchAndSetEcritures();
      if (queued) {
        toast.success("Validation en attente de synchronisation");
      } else {
        toast.success("Écriture validée avec succès");
      }
    } catch (error: any) {
      console.error("Failed to validate ecriture:", error);
      toast.error(`Erreur lors de la validation: ${error.body?.message || error.message || "Erreur inconnue"}`);
    }
  };

  const confirmDelete = async () => {
    if (!ecritureToDelete?.id) return;
    try {
      const { queued } = await deleteEcritureComptableOffline(ecritureToDelete.id);
      await fetchAndSetEcritures();
      if (selectedEcritureId === ecritureToDelete.id) {
        setSelectedEcritureId(null);
      }
      toast.success(queued ? "Suppression en attente de synchronisation" : "Écriture supprimée avec succès");
    } catch (error: any) {
      console.error("Failed to delete ecriture:", error);
      toast.error(`Erreur lors de la suppression: ${error.body?.message || error.message || "Erreur inconnue"}`);
    } finally {
      setEcritureToDelete(null);
    }
  };

  const confirmDeactivate = async () => {
    if (!ecritureToDeactivate?.id) return;
    try {
      const { queued } = await deactivateEcritureComptableOffline(ecritureToDeactivate.id);
      await fetchAndSetEcritures();
      toast.success(queued ? "Désactivation en attente de synchronisation" : "Écriture désactivée avec succès");
    } catch (error: any) {
      console.error("Failed to deactivate ecriture:", error);
      toast.error(`Erreur lors de la désactivation: ${error.body?.message || error.message || "Erreur inconnue"}`);
    } finally {
      setEcritureToDeactivate(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Upload the invoice
      const uploadResponse = await AccountingInvoiceUploadService.upload({ file });

      if (uploadResponse.success && uploadResponse.data) {
        toast.success("Facture analysée avec succès");

        // 2. Generate accounting entry from invoice data
        // We cast the data to any because ComptableObject has compatible structure
        const generationResponse = await AccountingEntriesService.generate1(uploadResponse.data as any);

        if (generationResponse.success) {
          toast.success("Écriture générée automatiquement");
          await fetchAndSetEcritures();
        } else {
          toast.error("Erreur lors de la génération de l'écriture");
        }
      } else {
        toast.error("Erreur lors de l'analyse de la facture");
      }
    } catch (error: any) {
      console.error("Upload/Generation failed:", error);
      toast.error(`Erreur: ${error.body?.message || error.message || "Une erreur est survenue"}`);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleEditEcriture = async (id: string) => {
    try {
      if (isOfflineClientId(id)) {
        const cached = await getCachedList<EcritureComptableDto[]>(CG_CACHE_KEYS.ECRITURES);
        const entry = cached?.data.find((e) => e.id === id);
        if (entry) {
          handleOpenCompose(entry);
          return;
        }
      }
      const response = await AccountingEntriesService.getById(id);
      if (response.success && response.data) {
        handleOpenCompose(response.data);
      }
    } catch (e) {
      console.error("Failed to fetch full entry for editing", e);
    }
  };

  const handleViewEcriture = (id: string) => {
    router.push(`/accounting/entries/${id}`);
  };

  const handleOpenCompose = (ecriture: EcritureComptableDto | null = null) => {
    onOpen({
      title: ecriture ? "Modifier l'Écriture Comptable" : "Nouvelle Écriture Comptable",
      content: (
        <EcritureComptableDetailView
          onSave={handleSave}
          onDelete={() => {
            if (ecriture) setEcritureToDelete(ecriture);
            closeCompose();
          }}
          onBack={closeCompose}
          ecriture={ecriture}
        />
      ),
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-1">Écritures Comptables</h2>
            <p className="text-sm text-gray-500">Gérez et consultez vos écritures comptables.</p>
          </div>
        </div>

        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />

        <EcritureComptableListView
          ecritures={ecritures}
          isLoading={isLoading}
          onSelectEcriture={handleViewEcriture} // Row click -> Navigate to Details Page
          onEditEcriture={handleEditEcriture}   // Edit click -> Edit Mode
          onDeleteEcriture={setEcritureToDelete}
          onDeactivateEcriture={setEcritureToDeactivate}
          onAddNew={() => handleOpenCompose()}
        />

        {ecritureToDelete && (
          <ConfirmationDialog
            isOpen={!!ecritureToDelete}
            onClose={() => setEcritureToDelete(null)}
            onConfirm={confirmDelete}
            title={`Supprimer ${ecritureToDelete.libelle} ?`}
            description="Cette action est irréversible. L'écriture sera supprimée si elle n'est pas validée."
          />
        )}

        {ecritureToDeactivate && (
          <ConfirmationDialog
            isOpen={!!ecritureToDeactivate}
            onClose={() => setEcritureToDeactivate(null)}
            onConfirm={confirmDeactivate}
            title={`Désactiver ${ecritureToDeactivate.libelle} ?`}
            description="L'écriture sera désactivée et ne sera plus prise en compte dans les calculs."
          />
        )}
      </div>
    </div >
  );
}