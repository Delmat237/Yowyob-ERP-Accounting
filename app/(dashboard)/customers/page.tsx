"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { Client } from '@/types/core';
import { CustomerListView } from '@/components/customers/customer-list-view';
import { CustomerDetailView } from '@/components/customers/customer-detail-view';
import { CustomerForm } from '@/components/customers/customer-form';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
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

export default function CustomersPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { onOpen, onClose: closeCompose } = useCompose();

  const fetchAndSetClients = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const accountsRes = await AccountingComptesService.getClientAccounts();

      if (accountsRes.success && accountsRes.data) {
        const mappedClients: Client[] = accountsRes.data.map(account => ({
          id: account.id || account.noCompte,
          code: account.noCompte,
          companyName: account.libelle,
          balance: account.solde || 0,
          isActive: account.actif ?? true,
          notes: account.notes,
          isTaxable: false,
          pricingLevels: [],
        }));
        setClients(mappedClients);
      } else {
        setClients([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch clients:", error);
      setError("Impossible de charger les clients. Veuillez vérifier votre connexion.");
      toast.error("Erreur lors de la récupération des clients");
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAndSetClients();
  }, [fetchAndSetClients]);

  useAutoRefresh(fetchAndSetClients, [fetchAndSetClients]);

  const handleSave = useCallback(async (data: Client) => {
    const isNew = !data.id || data.id === data.code;
    try {
      const accountData = {
        id: isNew ? undefined : data.id,
        libelle: data.companyName,
        noCompte: data.code,
        notes: data.notes || '',
        actif: data.isActive,
        typeCompte: 'CLIENT',
        solde: data.balance,
      };

      if (isNew) {
        await AccountingComptesService.createCompte(accountData);
        toast.success("Client créé");
      } else {
        await AccountingComptesService.updateCompte(data.id, accountData);
        toast.success("Client mis à jour");
      }
      await fetchAndSetClients();
      setSelectedClientId(null);
    } catch (error: any) {
      console.error("Failed to save client", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  }, [fetchAndSetClients]);

  const confirmDelete = (client: Client) => {
    if (client.id) setDeleteId(client.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await AccountingComptesService.deleteCompte(deleteId);
      toast.success("Client supprimé");
      await fetchAndSetClients();
      if (selectedClientId === deleteId) {
        setSelectedClientId(null);
      }
    } catch (error: any) {
      console.error("Failed to delete client:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSelectClient = (id: string) => {
    setSelectedClientId(id);
  };

  const handleEditClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) handleOpenCompose(client);
  };

  const handleAddNew = () => {
    handleOpenCompose(null);
  };

  const handleOpenCompose = (client: Client | null = null) => {
    onOpen({
      title: client ? "Modifier le Client" : "Nouveau Client",
      content: (
        <CustomerForm
          initialData={client}
          onSave={async (data) => {
            await handleSave(data);
            closeCompose();
          }}
          onCancel={closeCompose}
        />
      ),
      isMaximized: false // Normal size modal
    });
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  if (selectedClientId && selectedClient) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gray-100">
        <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight uppercase">Détails du Client</h2>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                onClick={() => handleEditClient(selectedClient.id!)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                onClick={() => confirmDelete(selectedClient)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CustomerDetailView
            client={selectedClient}
            onSave={handleSave}
            onDelete={() => confirmDelete(selectedClient)}
            onBack={() => setSelectedClientId(null)}
          />

          <div className="mt-8 pt-4 border-t flex justify-end">
            <Button variant="outline" onClick={() => setSelectedClientId(null)}>
              Fermer
            </Button>
          </div>
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement ce client.
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
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Clients</h2>
          <p className="text-sm text-gray-500">Gérez la liste de vos clients.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <CustomerListView
          clients={clients}
          isLoading={isLoading}
          onSelectClient={handleSelectClient}
          onEditClient={handleEditClient}
          onDeleteClient={confirmDelete}
          onAddNew={handleAddNew}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement ce client.
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