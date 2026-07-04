"use client";

import React from 'react';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Archive, Edit, Trash2, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';

interface ProductListViewProps {
    products: CompteDto[];
    isLoading: boolean;
    onSelectProduct: (id: string) => void;
    onEditProduct: (id: string) => void;
    onDeleteProduct: (product: CompteDto) => void;
    onAddNew: () => void;
}

const RowActions = ({ product, onEdit, onDelete }: { product: CompteDto, onEdit: (id: string) => void, onDelete: (product: CompteDto) => void }) => {
    return (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(product.id || '')}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Modifier</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(product)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Supprimer</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

export function ProductListView({ products, isLoading, onSelectProduct, onEditProduct, onDeleteProduct, onAddNew }: ProductListViewProps) {
    if (isLoading) return <CustomPageLoader message="Chargement des produits..." />;

    const columns: ColumnDef<CompteDto>[] = [
        {
            id: 'select',
            header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Tout sélectionner" />,
            cell: ({ row }) => <div className="group-hover:opacity-0 transition-opacity"><Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Sélectionner la ligne" /></div>,
        },
        {
            accessorKey: 'libelle',
            header: 'Article',
            cell: ({ row }) => (
                <div className="font-medium hover:underline cursor-pointer" onClick={() => onSelectProduct(row.original.id || '')}>
                    {row.original.libelle}
                </div>
            )
        },
        { accessorKey: 'noCompte', header: 'Code' },
        {
            accessorKey: 'solde',
            header: () => <div className="text-right">Valeur Stock</div>,
            cell: ({ row }) => <div className="text-right font-medium">{(row.original.solde || 0).toLocaleString('fr-FR')}</div>,
        },
        {
            accessorKey: 'actif',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={row.original.actif ? 'success' : 'secondary'}>{row.original.actif ? 'Actif' : 'Inactif'}</Badge>
        },
        {
            id: 'actions',
            cell: ({ row }) => <RowActions product={row.original} onEdit={onEditProduct} onDelete={onDeleteProduct} />,
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm h-full flex flex-col">
            <div className="p-4 border-b">
                <h1 className="text-xl font-semibold">Articles & Produits</h1>
            </div>
            <div className="p-2 border-b flex items-center gap-2">
                <Checkbox />
                <Button variant="ghost" size="icon"><Archive className="h-5 w-5" /></Button>
                <div className="flex-1" />
                <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2">
                    <PenSquare className="mr-2 h-4 w-4" /> Nouvel Article
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <DataTable columns={columns} data={products} />
            </div>
        </div>
    );
}
