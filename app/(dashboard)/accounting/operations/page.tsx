"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { OperationComptableDto } from '@/src/lib2/models/OperationComptableDto';
import { AccountingOperationsService } from '@/src/lib2/services/AccountingOperationsService';
import { OperationComptableListView } from '@/components/accounting/operation-comptable-list-view';
import { OperationForm } from '@/components/accounting/settings/operation-form';
import { OperationComptableReadView } from '@/components/accounting/operation-comptable-read-view';
import { toast } from 'sonner';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function OperationComptablePage() {
  const [operations, setOperations] = useState<OperationComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { onOpen, onClose: closeCompose } = useCompose();

  const fetchOperations = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const response = await AccountingOperationsService.getAllOperationsComptables();
      if (response && response.data) {
        setOperations(response.data);
      } else {
        setOperations([]);
      }
    } catch (err: any) {
      let reason = "Impossible de charger les opérations.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      console.error("Failed to fetch operations:", err);
      toast.error('Erreur lors du chargement', {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
      setError('Impossible de charger les opérations comptables. Veuillez vérifier votre connexion internet.');
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOperations();
  }, [fetchOperations]);

  useAutoRefresh(fetchOperations, [fetchOperations]);

  const handleSave = async (data: OperationComptableDto, journalIds: string[]) => {
    try {
      const isNew = !data.id;
      if (isNew) {
        const creationPromises = journalIds.map(journalId => {
          const operationForJournal: OperationComptableDto = {
            ...data,
            journalComptableId: journalId,
            contreparties: data.contreparties?.map(cp => ({
              ...cp,
              journalComptableId: cp.journalComptableId || journalId
            }))
          };
          return AccountingOperationsService.createOperationComptable(operationForJournal);
        });
        await Promise.all(creationPromises);
        toast.success(`${journalIds.length} opération(s) créée(s) avec succès`);
      } else {
        const updatedData: OperationComptableDto = {
          ...data,
          journalComptableId: journalIds[0] || data.journalComptableId,
          contreparties: data.contreparties?.map(cp => ({
            ...cp,
            journalComptableId: cp.journalComptableId || journalIds[0] || data.journalComptableId
          }))
        };
        await AccountingOperationsService.updateOperationComptable(data.id!, updatedData);
        toast.success('Opération mise à jour avec succès');
      }
      await fetchOperations();
      setSelectedOperationId(null);
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

  const confirmDelete = (operation: OperationComptableDto) => {
    if (operation.id) setDeleteId(operation.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await AccountingOperationsService.deleteOperationComptable(deleteId);
      toast.success('Opération supprimée');
      await fetchOperations();
      if (selectedOperationId === deleteId) {
        setSelectedOperationId(null);
      }
    } catch (err: any) {
      let reason = "Impossible de supprimer cette opération.";
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

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [viewData, setViewData] = useState<OperationComptableDto | null>(null);

  const handleSelectOperation = (id: string) => {
    const operation = operations.find(o => o.id === id);
    if (operation) {
      setViewData(operation);
      setViewMode('detail');
    }
  };

  const handleEditOperation = (id: string) => {
    const operation = operations.find(o => o.id === id);
    if (operation) handleOpenCompose(operation);
  };

  const handleAddNew = () => {
    handleOpenCompose(null);
  };

  const handleOpenCompose = (operation: OperationComptableDto | null = null) => {
    onOpen({
      title: operation ? "Modifier le Modèle d'Opération" : "Nouveau Modèle d'Opération",
      content: (
        <OperationForm
          initialData={operation}
          onSave={async (data, journalIds) => {
            await handleSave(data, journalIds);
            closeCompose();
          }}
          onCancel={closeCompose}
        />
      )
    });
  };

  if (viewMode === 'detail' && viewData) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gray-100">
        <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight uppercase">Détails d'Opération</h2>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                onClick={() => handleEditOperation(viewData.id!)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                onClick={() => confirmDelete(viewData)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <OperationComptableReadView
            operation={viewData}
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
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Opérations Comptables</h2>
          <p className="text-sm text-gray-500">Gérez les modèles d'opérations courantes (Ventes, Achats, Salaires).</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <OperationComptableListView
          operations={operations}
          isLoading={isLoading}
          onSelectOperation={handleSelectOperation}
          onEditOperation={handleEditOperation}
          onDeleteOperation={confirmDelete}
          onAddNew={handleAddNew}
          selectedId={selectedOperationId || undefined}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement le modèle d'opération.
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