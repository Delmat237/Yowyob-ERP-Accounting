"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { PlanComptableDto } from '@/src/lib2/models/PlanComptableDto';
import { AccountingPlanComptableService } from '@/src/lib2/services/AccountingPlanComptableService';
import { AccountListView } from '@/components/accounting/account-list-view';
import { AccountDetailView } from '@/components/accounting/account-detail-view';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ImportPlanComptableDialog } from '@/components/accounting/ImportPlanComptableDialog';
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
import { useCompose } from '@/hooks/use-compose-store';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { CG_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';
import { ensureLocalId } from '@/lib/offline/ensure-local-id';
import { removeListItemWithOutbox, upsertListItemWithOutbox } from '@/lib/offline/list-outbox-mutations';

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<PlanComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

  const { onOpen, onClose: closeCompose } = useCompose();

  const fetchAccounts = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
        fetcher: () => AccountingPlanComptableService.getAllPlanComptables(),
        emptyValue: [] as PlanComptableDto[],
      });
      setAccounts(result.data);
      setUsingCache(result.fromCache);
      setCacheTimestamp(result.cachedAt);
      if (result.fromCache) {
        setError(null);
      }
    } catch (err: any) {
      let reason = "Impossible de charger le plan comptable.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      console.error("Failed to fetch accounts:", err);
      toast.error('Erreur lors du chargement', {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
      setError('Impossible de charger les comptes. Veuillez vérifier votre connexion internet.');
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  useAutoRefresh(fetchAccounts, [fetchAccounts]);

  const handleSave = async (data: PlanComptableDto) => {
    try {
      const isNew = !data.id;
      const item: PlanComptableDto = {
        ...data,
        id: ensureLocalId(data.id),
      };

      await upsertListItemWithOutbox({
        cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
        entity: 'cg.plan_comptable',
        action: isNew ? 'CREATE' : 'UPDATE',
        item,
        onlineMutator: () =>
          isNew
            ? AccountingPlanComptableService.createPlanComptable(item)
            : AccountingPlanComptableService.updatePlanComptable(item.id!, item),
      });

      toast.success(isNew ? 'Compte créé avec succès' : 'Compte mis à jour avec succès');
      await fetchAccounts();
      setSelectedAccountId(null);
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

  const confirmDelete = (account: PlanComptableDto) => {
    if (account.id) setDeleteId(account.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await removeListItemWithOutbox({
        cacheKey: CG_CACHE_KEYS.PLAN_COMPTABLE,
        entity: 'cg.plan_comptable',
        entityId: deleteId,
        onlineMutator: () => AccountingPlanComptableService.deactivatePlanComptable(deleteId),
      });
      toast.success('Compte désactivé/supprimé');
      await fetchAccounts();
      if (selectedAccountId === deleteId) {
        setSelectedAccountId(null);
      }
    } catch (err: any) {
      let reason = "Impossible de supprimer ce compte.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      toast.error("Erreur de suppression", {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleInitPlan = async () => {
    setIsLoading(true);
    try {
      const tenantId =
        typeof window !== 'undefined'
          ? localStorage.getItem('organization_id') ?? undefined
          : undefined;

      if (!tenantId) {
        toast.error("Impossible d'identifier l'organisation (Tenant ID manquant). Connectez-vous d'abord.");
        return;
      }

      const initResponse = await AccountingPlanComptableService.initPlanComptable(tenantId);
      if (initResponse?.success === false) {
        throw new Error(initResponse.message || "Erreur lors de l'initialisation du plan comptable.");
      }
      toast.success('Le plan comptable OHADA 2025 a été initialisé avec succès');
      await fetchAccounts();
    } catch (err: any) {
      let reason = "Erreur lors de l'initialisation du plan comptable.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      toast.error("Échec de l'initialisation", {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [viewData, setViewData] = useState<PlanComptableDto | null>(null);

  const handleSelectAccount = (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (account) {
      setViewData(account);
      setViewMode('detail');
    }
  };

  const handleEditAccount = (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (account) handleOpenCompose(account, true);
  };

  const handleAddNew = () => {
    handleOpenCompose(null, true);
  };

  const handleOpenCompose = (account: PlanComptableDto | null = null, isEditing: boolean = false) => {
    onOpen({
      title: isEditing ? (account ? "Modifier le Compte" : "Nouveau Compte") : "Détails du Compte",
      content: (
        <AccountDetailView
          account={account}
          onSave={async (data) => {
            await handleSave(data);
            closeCompose();
          }}
          onDelete={() => {
            if (account) confirmDelete(account);
            closeCompose();
          }}
          onBack={closeCompose}
          forceEdit={isEditing}
          onEdit={() => {
            closeCompose();
            handleOpenCompose(account, true);
          }}
        />
      )
    });
  };

  if (viewMode === 'detail' && viewData) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gray-100">
        <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <AccountDetailView
            account={viewData}
            onSave={handleSave}
            onDelete={() => confirmDelete(viewData)}
            onBack={() => setViewMode('list')}
            onEdit={() => handleOpenCompose(viewData, true)}
          />

          <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action désactivera le compte.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  await handleDelete();
                  setViewMode('list');
                }} className="bg-red-600 hover:bg-red-700">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Plan Comptable</h2>
          <p className="text-sm text-gray-500">Gérez la liste de tous vos comptes.</p>
        </div>
        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AccountListView
          accounts={accounts}
          isLoading={isLoading}
          onSelectAccount={handleSelectAccount}
          onEditAccount={handleEditAccount}
          onDeleteAccount={confirmDelete}
          onAddNew={handleAddNew}
          onInitPlan={handleInitPlan}
          onImport={() => setIsImportOpen(true)}
          selectedId={selectedAccountId || undefined}
        />

        <ImportPlanComptableDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onSuccess={() => {
            fetchAccounts();
          }}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action désactivera le compte.
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
    </div>
  );
}