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

interface SupplierListViewProps {
    suppliers: CompteDto[];
    isLoading: boolean;
    onSelectSupplier: (id: string) => void;
    onEditSupplier: (id: string) => void;
    onDeleteSupplier: (supplier: CompteDto) => void;
    onAddNew: () => void;
}

const RowActions = ({ supplier, onEdit, onDelete }: { supplier: CompteDto, onEdit: (id: string) => void, onDelete: (supplier: CompteDto) => void }) => {
    return (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(supplier.id || '')}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Modifier</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(supplier)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Supprimer</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

export function SupplierListView({ suppliers, isLoading, onSelectSupplier, onEditSupplier, onDeleteSupplier, onAddNew }: SupplierListViewProps) {
    if (isLoading) return <CustomPageLoader message="Chargement des fournisseurs..." />;

    const columns: ColumnDef<CompteDto>[] = [
        {
            id: 'select',
            header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Tout sélectionner" />,
            cell: ({ row }) => <div className="group-hover:opacity-0 transition-opacity"><Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Sélectionner la ligne" /></div>,
        },
        {
            accessorKey: 'libelle',
            header: 'Fournisseur',
            cell: ({ row }) => (
                <div className="font-medium hover:underline cursor-pointer" onClick={() => onSelectSupplier(row.original.id || '')}>
                    {row.original.libelle}
                </div>
            )
        },
        { accessorKey: 'noCompte', header: 'Code' },
        {
            accessorKey: 'solde',
            header: () => <div className="text-right">Solde</div>,
            cell: ({ row }) => <div className="text-right"><span className={(row.original.solde || 0) >= 0 ? '' : 'text-red-600'}>{(row.original.solde || 0).toLocaleString('fr-FR')}</span></div>,
        },
        {
            accessorKey: 'actif',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={row.original.actif ? 'success' : 'secondary'}>{row.original.actif ? 'Actif' : 'Inactif'}</Badge>
        },
        {
            id: 'actions',
            cell: ({ row }) => <RowActions supplier={row.original} onEdit={onEditSupplier} onDelete={onDeleteSupplier} />,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
                    <PenSquare className="mr-2 h-4 w-4" />
                    Nouveau Fournisseur
                </Button>
            </div>
            <div className="rounded-md border">
                <DataTable columns={columns} data={suppliers} />
            </div>
        </div>
    );
}
