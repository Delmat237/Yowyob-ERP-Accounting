"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { JournalComptableDto } from '@/src/lib2/models/JournalComptableDto';
import { AccountingJournalManagementService } from '@/src/lib2/services/AccountingJournalManagementService';
import { JournalComptableListView } from '@/components/accounting/journal-comptable-list-view';
import { JournalComptableDetailView } from '@/components/accounting/journal-comptable-detail-view';
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

export default function JournalComptablePage() {
  const [journals, setJournals] = useState<JournalComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { onOpen, onClose: closeCompose } = useCompose();

  const fetchJournals = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const response = await AccountingJournalManagementService.getAllJournals();
      if (response && response.data) {
        setJournals(response.data);
      } else {
        setJournals([]);
      }
    } catch (err: any) {
      let reason = "Impossible de charger les journaux.";
      if (err.body?.message) reason = err.body.message;
      else if (err.message) reason = err.message;

      console.error("Failed to fetch journals:", err);
      toast.error('Erreur lors du chargement', {
        description: reason,
        className: "bg-red-50 border-red-200 text-red-800"
      });
      setError('Impossible de charger les journaux comptables. Veuillez vérifier votre connexion internet.');
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJournals();
  }, [fetchJournals]);

  useAutoRefresh(fetchJournals, [fetchJournals]);

  const handleSave = async (data: JournalComptableDto) => {
    try {
      if (data.id) {
        await AccountingJournalManagementService.updateJournal(data.id, data);
        toast.success('Journal mis à jour avec succès', {
          description: `Le journal ${data.codeJournal} a été modifié.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        await AccountingJournalManagementService.createJournal(data);
        toast.success('Journal créé avec succès', {
          description: `Le nouveau journal ${data.codeJournal} a été ajouté.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      }
      await fetchJournals();
      setSelectedJournalId(null);
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

  const confirmDelete = (journal: JournalComptableDto) => {
    if (journal.id) setDeleteId(journal.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await AccountingJournalManagementService.deleteJournal(deleteId);
      toast.success('Journal supprimé', {
        description: 'Le journal a été retiré avec succès.',
        className: "bg-green-50 border-green-200 text-green-800"
      });
      await fetchJournals();
      if (selectedJournalId === deleteId) {
        setSelectedJournalId(null);
      }
    } catch (err: any) {
      let reason = "Impossible de supprimer ce journal.";
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
  const [viewData, setViewData] = useState<JournalComptableDto | null>(null);

  const handleSelectJournal = (id: string) => {
    const journal = journals.find(j => j.id === id);
    if (journal) {
      setViewData(journal);
      setViewMode('detail');
    }
  };

  const handleEditJournal = (id: string) => {
    const journal = journals.find(j => j.id === id);
    if (journal) handleOpenCompose(journal, true);
  };

  const handleAddNew = () => {
    handleOpenCompose(null, true);
  };

  const handleOpenCompose = (journal: JournalComptableDto | null = null, isEditing: boolean = false) => {
    onOpen({
      title: isEditing ? (journal ? "Modifier le Journal" : "Nouveau Journal") : "Détails du Journal",
      isMaximized: false,
      content: (
        <JournalComptableDetailView
          journal={journal}
          onSave={async (data) => {
            await handleSave(data);
            closeCompose();
          }}
          onBack={closeCompose}
          onDelete={() => {
            if (journal) confirmDelete(journal);
            closeCompose();
          }}
          forceEdit={isEditing}
          onEdit={() => {
            closeCompose();
            handleOpenCompose(journal, true);
          }}
        />
      )
    });
  };

  if (viewMode === 'detail' && viewData) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gray-100">
        <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <JournalComptableDetailView
            journal={viewData}
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
                  Cette action est irréversible. Cela supprimera définitivement le journal
                  et pourrait affecter les écritures associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  handleDelete();
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
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Journaux Comptables</h2>
          <p className="text-sm text-gray-500">Gérez vos journaux auxiliaires (Ventes, Achats, Banque, Caisse, OD).</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <JournalComptableListView
          journals={journals}
          isLoading={isLoading}
          onSelectJournal={handleSelectJournal}
          onEditJournal={handleEditJournal}
          onDeleteJournal={confirmDelete}
          onAddNew={handleAddNew}
          selectedId={selectedJournalId || undefined}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement le journal
                et pourrait affecter les écritures associées.
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