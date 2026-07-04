"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { TaxeDto } from '@/src/lib2/models/TaxeDto';
import { AccountingTaxManagementService } from '@/src/lib2/services/AccountingTaxManagementService';
import { TaxeListView } from '@/components/accounting/taxe-list-view';
import { TaxeForm } from '@/components/accounting/settings/taxes-form';
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

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<TaxeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { onOpen, onClose: closeCompose } = useCompose();

  const fetchTaxes = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const response = await AccountingTaxManagementService.getAllTaxes();
      if (response && response.data) {
        setTaxes(response.data);
      } else {
        setTaxes([]);
      }
    } catch (err: any) {
      let reason = "Impossible de charger les taxes.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      console.error("Failed to fetch taxes:", err);
      toast.error('Erreur lors du chargement', {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
      setError('Impossible de charger les taxes. Veuillez vérifier votre connexion internet.');
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTaxes();
  }, [fetchTaxes]);

  useAutoRefresh(fetchTaxes, [fetchTaxes]);

  const handleSave = async (data: TaxeDto) => {
    try {
      if (data.id) {
        await AccountingTaxManagementService.updateTaxe(data.id, data);
        toast.success('Taxe mise à jour avec succès', {
          description: `La taxe ${data.code} a été modifiée.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        await AccountingTaxManagementService.createTaxe(data);
        toast.success('Taxe créée avec succès', {
          description: `La nouvelle taxe ${data.code} a été ajoutée.`,
          className: "bg-green-50 border-green-200 text-red-800"
        });
      }
      await fetchTaxes();
    } catch (err: any) {
      let reason = "Une erreur inattendue est survenue.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      toast.error("Erreur lors de l'enregistrement", {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
      throw err; // Re-throw to allow form to handle error if needed
    }
  };

  const confirmDelete = (taxe: TaxeDto) => {
    if (taxe.id) setDeleteId(taxe.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await AccountingTaxManagementService.deleteTaxe(deleteId);
      toast.success('Taxe supprimée', {
        description: 'La taxe a été retirée avec succès.',
        className: "bg-green-50 border-green-200 text-green-800"
      });
      await fetchTaxes();
    } catch (err: any) {
      let reason = "Impossible de supprimer cette taxe.";
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

  const handleEditTaxe = (id: string) => {
    const taxe = taxes.find(t => t.id === id);
    if (taxe) handleOpenCompose(taxe);
  };

  const handleAddNew = () => {
    handleOpenCompose(null);
  };

  const handleOpenCompose = (taxe: TaxeDto | null = null) => {
    onOpen({
      title: taxe ? "Modifier la Taxe" : "Nouvelle Taxe",
      isMaximized: false,
      content: (
        <TaxeForm
          initialData={taxe}
          onSave={async (data) => {
            await handleSave(data);
            closeCompose();
          }}
          onCancel={closeCompose}
        />
      )
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Gestion des Taxes</h2>
          <p className="text-sm text-gray-500">Configurez et gérez les différentes taxes applicables dans votre comptabilité.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TaxeListView
          taxes={taxes}
          isLoading={isLoading}
          onEdit={handleEditTaxe}
          onDelete={confirmDelete}
          onAddNew={handleAddNew}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Vérifiez qu'aucune transaction n'utilise cette taxe avant suppression.
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