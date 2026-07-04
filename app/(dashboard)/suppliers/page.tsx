"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
import { SupplierListView } from '@/components/suppliers/supplier-list-view';
import { SupplierDetailView } from '@/components/suppliers/supplier-detail-view';
import { SupplierForm } from '@/components/suppliers/supplier-form';
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

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<CompteDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { onOpen, onClose: closeCompose } = useCompose();

    const fetchAndSetSuppliers = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) setIsLoading(true);
        setError(null);
        try {
            const res = await AccountingComptesService.getSupplierAccounts();
            if (res.success && res.data) {
                setSuppliers(res.data);
            } else {
                setSuppliers([]);
            }
        } catch (error: any) {
            console.error("Failed to fetch suppliers:", error);
            setError("Impossible de charger les fournisseurs. Veuillez vérifier votre connexion.");
            toast.error("Erreur lors de la récupération des fournisseurs");
        } finally {
            if (!options?.silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAndSetSuppliers();
    }, [fetchAndSetSuppliers]);

    useAutoRefresh(fetchAndSetSuppliers, [fetchAndSetSuppliers]);

    const handleSave = async (data: CompteDto) => {
        try {
            if (data.id) {
                await AccountingComptesService.updateCompte(data.id, data);
                toast.success("Fournisseur mis à jour");
            } else {
                await AccountingComptesService.createCompte({
                    ...data,
                    typeCompte: 'FOURNISSEUR'
                });
                toast.success("Fournisseur créé");
            }
            await fetchAndSetSuppliers();
            setSelectedSupplierId(null);
        } catch (error: any) {
            console.error("Failed to save supplier", error);
            toast.error("Erreur lors de l'enregistrement");
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await AccountingComptesService.deleteCompte(deleteId);
            toast.success("Fournisseur supprimé");
            await fetchAndSetSuppliers();
            if (selectedSupplierId === deleteId) {
                setSelectedSupplierId(null);
            }
        } catch (error) {
            console.error("Failed to delete supplier:", error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeleteId(null);
        }
    };

    const handleSelectSupplier = (id: string) => {
        setSelectedSupplierId(id);
    };

    const handleEditSupplier = (id: string) => {
        const supplier = suppliers.find(s => s.id === id);
        if (supplier) handleOpenCompose(supplier);
    };

    const handleAddNew = () => {
        handleOpenCompose(null);
    };

    const handleOpenCompose = (supplier: CompteDto | null = null) => {
        onOpen({
            title: supplier ? "Modifier le Fournisseur" : "Nouveau Fournisseur",
            content: (
                <SupplierForm
                    initialData={supplier}
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

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    if (selectedSupplierId && selectedSupplier) {
        return (
            <div className="min-h-screen flex flex-col p-4 bg-gray-100">
                <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-8 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight uppercase">Détails du Fournisseur</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                                onClick={() => handleEditSupplier(selectedSupplier.id!)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => confirmDelete(selectedSupplier.id!)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <SupplierDetailView
                        supplier={selectedSupplier}
                        onSave={handleSave}
                        onDelete={(id) => confirmDelete(id)}
                        onBack={() => setSelectedSupplierId(null)}
                    />

                    <div className="mt-8 pt-4 border-t flex justify-end">
                        <Button variant="outline" onClick={() => setSelectedSupplierId(null)}>
                            Fermer
                        </Button>
                    </div>
                </div>

                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action supprimera définitivement ce fournisseur.
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
                    <h2 className="text-xl font-semibold text-gray-700 mb-1">Fournisseurs</h2>
                    <p className="text-sm text-gray-500">Gérez la liste de vos fournisseurs.</p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <SupplierListView
                    suppliers={suppliers}
                    isLoading={isLoading}
                    onSelectSupplier={handleSelectSupplier}
                    onEditSupplier={handleEditSupplier}
                    onDeleteSupplier={(s) => { if (s.id) confirmDelete(s.id) }}
                    onAddNew={handleAddNew}
                />

                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action supprimera définitivement ce fournisseur.
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