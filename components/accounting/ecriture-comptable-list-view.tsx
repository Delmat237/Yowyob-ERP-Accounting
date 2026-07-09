// components/accounting/ecriture-comptable-list-view.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EcritureComptableDto } from '@/src/lib2/models/EcritureComptableDto';
import { Edit, Trash2, Plus, Search, Archive, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useNationalCurrency } from '@/hooks/use-national-currency';

import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/src/lib/auth/roles';

// Helper: detect if an entry was rejected (rejection reason stored in notes)
const getRejectionReason = (notes?: string | null): string | null => {
  if (!notes) return null;
  const marker = '[REJETÉ]: ';
  const idx = notes.indexOf(marker);
  if (idx === -1) return null;
  return notes.slice(idx + marker.length).trim() || null;
};

interface EcritureComptableListViewProps {
  ecritures: EcritureComptableDto[];
  isLoading: boolean;
  onSelectEcriture: (id: string) => void;
  onEditEcriture: (id: string) => void;
  onDeleteEcriture: (ecriture: EcritureComptableDto) => void;
  onDeactivateEcriture?: (ecriture: EcritureComptableDto) => void;
  onAddNew?: () => void;
  selectedId?: string;
  readOnly?: boolean;
}

const RowActions = ({ ecriture, onEdit, onDelete, onDeactivate }: { ecriture: EcritureComptableDto, onEdit: (id: string) => void, onDelete: (ecriture: EcritureComptableDto) => void, onDeactivate?: (ecriture: EcritureComptableDto) => void }) => {
  const { accountingRole } = useAuth();
  const canDelete = hasPermission(accountingRole, 'journal_entries', 'delete');
  const canUpdate = hasPermission(accountingRole, 'journal_entries', 'update');

  if (ecriture.validee) return null; // Hide actions if validated

  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
      <TooltipProvider>
        {canUpdate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50" onClick={() => onEdit(ecriture.id || '')}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Modifier</p></TooltipContent>
          </Tooltip>
        )}
        {onDeactivate && canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-orange-600 hover:bg-orange-50" onClick={() => onDeactivate(ecriture)}>
                <Archive className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Désactiver</p></TooltipContent>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(ecriture)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Supprimer</p></TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export const EcritureComptableListView: React.FC<EcritureComptableListViewProps> = ({
  ecritures = [],
  isLoading,
  onSelectEcriture,
  onEditEcriture,
  onDeleteEcriture,
  onDeactivateEcriture,
  onAddNew,
  selectedId,
  readOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModalReason, setRejectModalReason] = useState<{ isOpen: boolean; reason: string | null; libelle: string | null }>({
    isOpen: false,
    reason: null,
    libelle: null
  });
  const { nationalCurrency } = useNationalCurrency();
  const currencyCode = nationalCurrency?.code || 'XAF';

  const filteredEcritures = useMemo(() => {
    return ecritures.filter(ecriture => {
      const matchesSearch =
        ecriture.libelle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ecriture.journalComptableLibelle?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [ecritures, searchQuery]);

  if (isLoading) return <CustomPageLoader message="Chargement des écritures..." />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {!readOnly && (
        <div className="space-y-4">
          {/* Top Row: Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Bottom Row: Actions */}
          <div className="flex items-center justify-between">
            {onAddNew && (
              <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Écriture
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900">Libellé</TableHead>
              <TableHead className="font-bold text-gray-900">Date</TableHead>
              <TableHead className="font-bold text-gray-900">Journal</TableHead>
              <TableHead className="font-bold text-gray-900 text-right">Montant Débit</TableHead>
              <TableHead className="font-bold text-gray-900 text-right">Montant Crédit</TableHead>
              <TableHead className="font-bold text-gray-900 text-center">Validée</TableHead>
              {!readOnly && <TableHead className="text-right font-bold text-gray-900 px-6">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEcritures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 6 : 7} className="text-center py-10 text-gray-400 font-medium italic">
                  Aucune écriture trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredEcritures.map((ecriture) => {
                const rejectionReason = getRejectionReason(ecriture.notes);
                return (
                  <TableRow
                    key={ecriture.id}
                    className={`group cursor-pointer transition-colors hover:bg-blue-50/50 ${selectedId === ecriture.id ? 'bg-blue-100/50 shadow-sm border-blue-200' : ''}`}
                    onClick={() => onSelectEcriture(ecriture.id || '')}
                  >
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {ecriture.libelle}
                        {ecriture.attachmentIds && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <FileText className="h-3 w-3 text-blue-500" />
                              </TooltipTrigger>
                              <TooltipContent>Document joint</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(ecriture.dateEcriture).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-blue-200 text-blue-700 bg-blue-50/50">
                        {ecriture.journalComptableLibelle}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      {(ecriture.montantTotalDebit || (ecriture.detailsEcriture?.reduce((sum, d) => sum + (Number(d.montantDebit) || 0), 0) || 0)).toLocaleString('fr-FR')} {currencyCode}
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      {(ecriture.montantTotalCredit || (ecriture.detailsEcriture?.reduce((sum, d) => sum + (Number(d.montantCredit) || 0), 0) || 0)).toLocaleString('fr-FR')} {currencyCode}
                    </TableCell>
                    <TableCell className="text-center">
                      {ecriture.validee ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">
                          Validée
                        </Badge>
                      ) : rejectionReason ? (
                        <div className="flex items-center justify-center gap-2">
                          <Badge className="bg-red-100 text-red-700 border-none gap-1">
                            <AlertCircle className="h-3 w-3" /> Rejeté
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectModalReason({ isOpen: true, reason: rejectionReason, libelle: ecriture.libelle });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors whitespace-nowrap"
                          >
                            Motif du rejet
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                            Brouillon
                          </Badge>
                          {(ecriture as { _offlinePending?: boolean })._offlinePending && (
                            <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">
                              Sync en attente
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        <RowActions
                          ecriture={ecriture}
                          onEdit={onEditEcriture}
                          onDelete={onDeleteEcriture}
                          onDeactivate={onDeactivateEcriture}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rejectModalReason.isOpen} onOpenChange={(open) => setRejectModalReason(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md border-red-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Motif du rejet
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Pour l'écriture : <span className="font-semibold text-gray-700">« {rejectModalReason.libelle} »</span>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-2">
            <p className="text-sm text-red-900 whitespace-pre-wrap leading-relaxed">
              {rejectModalReason.reason}
            </p>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setRejectModalReason(prev => ({ ...prev, isOpen: false }))}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};