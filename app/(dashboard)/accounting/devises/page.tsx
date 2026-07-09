"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { Devise } from '@/types/accounting';
import { CurrencyManagementService } from '@/src/lib2/services/CurrencyManagementService';
import { ExchangeRateManagementService } from '@/src/lib2/services/ExchangeRateManagementService';
import { DeviseDto } from '@/src/lib2/models/DeviseDto';
import { DeviseListView } from '@/components/accounting/devise-list-view';
import { DeviseForm } from '@/components/accounting/settings/devise-form';
import { DeviseRateForm } from '@/components/accounting/settings/devise-rate-form';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCompose } from '@/hooks/use-compose-store';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { CG_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';
import { getCachedListData, replaceListWithOutbox } from "@/lib/offline/list-outbox-mutations";
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

export default function DevisesPage() {
  const [devises, setDevises] = useState<Devise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeviseId, setSelectedDeviseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

  const { onOpen, onClose: closeCompose } = useCompose();

  const mapDevises = useCallback(
    (currencies: DeviseDto[], rates: { devise_source_id?: string; devise_cible_id?: string; taux?: number }[]) => {
      const nationalCurrency = currencies.find((c) => c.est_nationale);
      return currencies.map((c) => {
        const rateEntry = rates.find(
          (r) => r.devise_source_id === c.id && r.devise_cible_id === nationalCurrency?.id,
        );
        return {
          id: c.id!,
          name: c.nom,
          code: c.code,
          symbol: c.symbole || '',
          rate: rateEntry ? rateEntry.taux : c.est_nationale ? 1.0 : 0,
          estNationale: c.est_nationale,
          isActive: c.actif,
        } satisfies Devise;
      });
    },
    [],
  );

  const fetchDevises = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: CG_CACHE_KEYS.DEVISES,
        fetcher: async () => {
          const [currenciesRes, ratesRes] = await Promise.all([
            CurrencyManagementService.getAllDevises(),
            ExchangeRateManagementService.getOrganizationRates(),
          ]);
          if (!currenciesRes.success || !currenciesRes.data) return [] as Devise[];
          const rates = ratesRes.success && ratesRes.data ? ratesRes.data : [];
          return mapDevises(currenciesRes.data, rates);
        },
        emptyValue: [] as Devise[],
      });
      setDevises(result.data);
      setUsingCache(result.fromCache);
      setCacheTimestamp(result.cachedAt);
      if (result.fromCache) setError(null);
    } catch (err: any) {
      let reason = "Impossible de charger les devises.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      console.error("Failed to fetch devises:", err);
      toast.error('Erreur lors du chargement', {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
      setError('Impossible de charger les devises. Veuillez vérifier votre connexion internet.');
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, [mapDevises]);

  useEffect(() => {
    void fetchDevises();
  }, [fetchDevises]);

  useAutoRefresh(fetchDevises, [fetchDevises]);

  const handleSave = async (data: Devise) => {
    try {
      const isNew = !data.id || data.id.includes('.');

      const deviseDto: DeviseDto = {
        id: isNew ? (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)) : data.id,
        nom: data.name,
        code: data.code,
        symbole: data.symbol,
        actif: data.isActive ?? true,
        est_nationale: data.estNationale ?? false
      };

      if (isNew) {
        // Optimiste : met à jour la liste locale immédiatement (visible offline).
        const prev = await getCachedListData<Devise[]>(CG_CACHE_KEYS.DEVISES, devises);
        const next = [{ ...data, id: deviseDto.id }, ...prev.filter((d) => d.id !== deviseDto.id)];
        await replaceListWithOutbox({
          cacheKey: CG_CACHE_KEYS.DEVISES,
          entity: "cg.devises",
          action: "CREATE",
          entityId: deviseDto.id!,
          nextList: next,
          payload: deviseDto,
          onlineMutator: () => CurrencyManagementService.createDevise(deviseDto),
        });
        toast.success('Devise créée avec succès');
      } else {
        const prev = await getCachedListData<Devise[]>(CG_CACHE_KEYS.DEVISES, devises);
        const next = prev.map((d) => (d.id === data.id ? { ...d, ...data } : d));
        await replaceListWithOutbox({
          cacheKey: CG_CACHE_KEYS.DEVISES,
          entity: "cg.devises",
          action: "UPDATE",
          entityId: data.id,
          nextList: next,
          payload: deviseDto,
          onlineMutator: () => CurrencyManagementService.updateDevise(data.id, deviseDto),
        });
        toast.success('Devise mise à jour avec succès');
      }
      await fetchDevises();
      setSelectedDeviseId(null);
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

  const confirmDelete = (devise: Devise) => {
    if (devise.id) setDeleteId(devise.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const prev = await getCachedListData<Devise[]>(CG_CACHE_KEYS.DEVISES, devises);
      const next = prev.filter((d) => d.id !== deleteId);
      await replaceListWithOutbox({
        cacheKey: CG_CACHE_KEYS.DEVISES,
        entity: "cg.devises",
        action: "DELETE",
        entityId: deleteId,
        nextList: next,
        payload: { id: deleteId },
        onlineMutator: () => CurrencyManagementService.deleteDevise(deleteId),
      });
      toast.success("Devise supprimée");
      await fetchDevises();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur de suppression");
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdateRate = (id: string) => {
    const devise = devises.find(d => d.id === id);
    const nationalCurrency = devises.find(d => d.estNationale);

    if (devise && nationalCurrency) {
      onOpen({
        title: `Mise à jour du taux : ${devise.code} / ${nationalCurrency.code}`,
        isMaximized: false,
        content: (
          <DeviseRateForm
            initialRate={devise.rate || 0}
            currencyCode={devise.code}
            nationalCurrencyCode={nationalCurrency.code}
            onSave={(rate) => handleSaveRate(devise.id, nationalCurrency.id, rate)}
            onCancel={closeCompose}
          />
        )
      });
    } else if (!nationalCurrency) {
      toast.error("Aucune devise nationale définie pour la référence.");
    }
  };

  const handleSaveRate = async (sourceId: string, targetId: string, rate: number) => {
    try {
      // Optimiste : met à jour le rate local de la devise source.
      const prev = await getCachedListData<Devise[]>(CG_CACHE_KEYS.DEVISES, devises);
      const next = prev.map((d) => (d.id === sourceId ? { ...d, rate } : d));
      await replaceListWithOutbox({
        cacheKey: CG_CACHE_KEYS.DEVISES,
        entity: "cg.devises_rates",
        action: "CREATE",
        entityId: `${sourceId}:${targetId}`,
        nextList: next,
        payload: { sourceId, targetId, rate },
        onlineMutator: () => ExchangeRateManagementService.createTauxChange({
        devise_source_id: sourceId,
        devise_cible_id: targetId,
        taux: rate,
        date_effet: new Date().toISOString()
      }),
      });
      toast.success("Taux de change mis à jour");
      await fetchDevises();
      closeCompose();
    } catch (err: any) {
      console.error("Failed to update rate:", err);
      toast.error("Erreur lors de la mise à jour du taux");
    }
  };

  const handleEditDevise = (id: string) => {
    const devise = devises.find(d => d.id === id);
    if (devise) handleOpenCompose(devise);
  };

  const handleAddNew = () => {
    handleOpenCompose(null);
  };

  const handleOpenCompose = (devise: Devise | null = null) => {
    onOpen({
      title: devise ? "Modifier la Devise" : "Nouvelle Devise",
      isMaximized: false,
      content: (
        <DeviseForm
          initialData={devise}
          onSave={async (data) => {
            await handleSave(data);
            closeCompose();
          }}
          onCancel={closeCompose}
          isNationalDisabled={devises.some(d => d.estNationale && d.id !== devise?.id)}
        />
      )
    });
  };


  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Devises</h2>
          <p className="text-sm text-gray-500">Gérez les devises et taux de change.</p>
        </div>

        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DeviseListView
          devises={devises}
          isLoading={isLoading}
          onEdit={handleEditDevise}
          onDelete={confirmDelete}
          onAddNew={handleAddNew}
          onUpdateRate={handleUpdateRate}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suppression non disponible</AlertDialogTitle>
              <AlertDialogDescription>
                La suppression des devises nécessite une vérification approfondie des dépendances.
                Veuillez contacter l'administrateur.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fermer</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}