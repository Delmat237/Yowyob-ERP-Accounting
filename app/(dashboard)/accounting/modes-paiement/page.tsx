"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { ModePaiement } from '@/types/accounting';
import { ModePaiementListView } from '@/components/accounting/mode-paiement-list-view';
import { ModePaiementForm } from '@/components/accounting/settings/mode-paiement-form';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

// --- Mocks kept for consistency with original file ---
const mockModes: ModePaiement[] = [
  { id: '1', name: 'Compte UBA', type: 'banque', journalId: '521100' },
  { id: '2', name: 'Caisse Principale', type: 'especes', journalId: '571100' },
  { id: '3', name: 'Orange Money', type: 'mobile_money', journalId: '573100' },
];

export default function ModesPaiementPage() {
  const [modes, setModes] = useState<ModePaiement[]>(mockModes);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchModes = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    // Simulate fetch
    setTimeout(() => {
      setModes(mockModes);
      if (!options?.silent) setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    void fetchModes();
  }, [fetchModes]);

  useAutoRefresh(fetchModes, [fetchModes]);

  const handleSave = async (data: ModePaiement) => {
    try {
      // Mock save logic
      const isNew = !data.id;
      if (isNew) {
        const created = { ...data, id: Math.random().toString() };
        setModes((prev) => [...prev, created]);
        toast.success('Mode de paiement créé');
      } else {
        setModes((prev) => prev.map(m => m.id === data.id ? data : m));
        toast.success('Mode de paiement mis à jour');
      }
      setSelectedModeId(null);
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const confirmDelete = (mode: ModePaiement) => {
    if (mode.id) setDeleteId(mode.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setModes((prev) => prev.filter(m => m.id !== deleteId));
      toast.success('Mode de paiement supprimé');
      if (selectedModeId === deleteId) {
        setSelectedModeId(null);
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error("Erreur de suppression");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSelectMode = (id: string) => {
    setSelectedModeId(id);
    setIsEditing(false);
  };

  const handleEditMode = (id: string) => {
    setSelectedModeId(id);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setSelectedModeId('new');
    setIsEditing(true);
  };

  const handleBack = () => {
    setSelectedModeId(null);
    setIsEditing(false);
  };

  const selectedMode = selectedModeId === 'new' ? null : modes.find(m => m.id === selectedModeId);

  if (selectedModeId) {
    return (
      <div className="min-h-screen p-4 bg-gray-100">
        <div className="w-full max-w-5xl mx-auto">
          <ModePaiementForm
            initialData={selectedMode || {}}
            onSave={handleSave}
            onCancel={handleBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Modes de Paiement</h2>
          <p className="text-sm text-gray-500">Gérez les différents moyens de paiement acceptés.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ModePaiementListView
          modes={modes}
          isLoading={isLoading}
          onEdit={handleEditMode}
          onDelete={confirmDelete}
          onAddNew={handleAddNew}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible.
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