// components/accounting/taxe-list-view.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TaxeDto } from '@/src/lib2/models/TaxeDto';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface TaxeListViewProps {
  taxes: TaxeDto[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (taxe: TaxeDto) => void;
  onAddNew: () => void;
}

const RowActions = ({ taxe, onEdit, onDelete }: {
  taxe: TaxeDto,
  onEdit: (id: string) => void,
  onDelete: (taxe: TaxeDto) => void
}) => {
  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      <TooltipProvider>
        <PermissionGuard feature="taxes" action="update">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); onEdit(taxe.id!); }}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Modifier la taxe</p></TooltipContent>
          </Tooltip>
        </PermissionGuard>
        <PermissionGuard feature="taxes" action="delete">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(taxe); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Supprimer la taxe</p></TooltipContent>
          </Tooltip>
        </PermissionGuard>
      </TooltipProvider>
    </div>
  );
};

export const TaxeListView: React.FC<TaxeListViewProps> = ({
  taxes = [],
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTaxes = taxes.filter((taxe) => {
    return (
      taxe.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taxe.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (taxe.compte_collecte && taxe.compte_collecte.includes(searchTerm)) ||
      (taxe.compte_deductible && taxe.compte_deductible.includes(searchTerm))
    );
  });

  if (isLoading) return <CustomPageLoader message="Chargement des taxes..." />;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Top Row: Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par libellé, code ou compte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-gray-200"
            />
          </div>
        </div>

        {/* Bottom Row: Action buttons */}
        <div className="flex items-center justify-between w-full">
          <PermissionGuard feature="taxes" action="create">
            <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Taxe
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Code</TableHead>
              <TableHead className="font-semibold text-gray-700">Libellé</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Taux</TableHead>
              <TableHead className="font-semibold text-gray-700">Comptes (Coll. / Déd.)</TableHead>
              <TableHead className="font-semibold text-gray-700">Statut</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTaxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium italic">
                  Aucune taxe trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredTaxes.map((taxe) => (
                <TableRow
                  key={taxe.id}
                  className="group hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => onEdit(taxe.id!)}
                >
                  <TableCell className="font-mono font-medium text-blue-600">{taxe.code}</TableCell>
                  <TableCell className="font-medium text-gray-900">{taxe.libelle}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100">
                      {taxe.taux}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600 italic">
                      {taxe.compte_collecte || '—'} / {taxe.compte_deductible || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={taxe.actif ? 'default' : 'secondary'} className={taxe.actif ? 'bg-green-100 text-green-700 hover:bg-green-200 border-none' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}>
                      {taxe.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions taxe={taxe} onEdit={onEdit} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};