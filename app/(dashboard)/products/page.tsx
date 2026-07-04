"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
import { useCompose } from '@/hooks/use-compose-store';
import { ProductForm } from '@/components/products/product-form';
import { ProductListView } from '@/components/products/product-list-view';
import { ProductDetailView } from '@/components/products/product-detail-view';
import { toast } from 'sonner';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
  const [products, setProducts] = useState<CompteDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { onOpen, onClose: closeCompose } = useCompose();

  const fetchAndSetProducts = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const res = await AccountingComptesService.getAccountsByType('STOCK');
      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      setError("Impossible de charger les articles. Veuillez vérifier votre connexion.");
      toast.error("Erreur lors de la récupération des articles");
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAndSetProducts();
  }, [fetchAndSetProducts]);

  useAutoRefresh(fetchAndSetProducts, [fetchAndSetProducts]);

  const handleSave = async (data: CompteDto) => {
    try {
      if (data.id) {
        await AccountingComptesService.updateCompte(data.id, data);
        toast.success("Article mis à jour");
      } else {
        await AccountingComptesService.createCompte({
          ...data,
          typeCompte: 'STOCK'
        });
        toast.success("Article créé");
      }
      await fetchAndSetProducts();
      setSelectedProductId(null);
    } catch (error: any) {
      console.error("Failed to save product", error);
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
      toast.success("Article supprimé");
      await fetchAndSetProducts();
      if (selectedProductId === deleteId) {
        setSelectedProductId(null);
      }
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
  };

  const handleEditProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) handleOpenCompose(product);
  };

  const handleAddNew = () => {
    handleOpenCompose(null);
  };

  const handleOpenCompose = (product: CompteDto | null = null) => {
    onOpen({
      title: product ? "Modifier l'Article" : "Nouvel Article",
      content: (
        <ProductForm
          initialData={product}
          onSave={async (data) => {
            await handleSave(data);
            closeCompose();
          }}
        />
      ),
      isMaximized: false // Normal size modal for products
    });
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (selectedProductId && selectedProduct) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gray-100">
        <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight uppercase">Détails de l'Article</h2>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                onClick={() => handleEditProduct(selectedProduct.id!)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                onClick={() => confirmDelete(selectedProduct.id!)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ProductDetailView
            product={selectedProduct}
            onSave={handleSave}
            onDelete={(id) => confirmDelete(id)}
            onBack={() => setSelectedProductId(null)}
          />

          <div className="mt-8 pt-4 border-t flex justify-end">
            <Button variant="outline" onClick={() => setSelectedProductId(null)}>
              Fermer
            </Button>
          </div>
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement cet article.
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
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Articles</h2>
          <p className="text-sm text-gray-500">Gérez la liste de vos articles.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ProductListView
          products={products}
          isLoading={isLoading}
          onSelectProduct={handleSelectProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={(p) => { if (p.id) confirmDelete(p.id) }}
          onAddNew={handleAddNew}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement cet article.
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