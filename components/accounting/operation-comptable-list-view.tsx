"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OperationComptableDto } from '@/src/lib2/models/OperationComptableDto';
import { Edit, Trash2, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const OPERATION_TEMPLATES: Record<string, string> = {
  "VENTE": "Vente CLIENT",
  "ACHAT": "Achat FOURNISSEUR",
  "SALAIRE": "Salaire PERSONNEL",
  "PAIEMENT": "Paiement BANQUE/CAISSE",
  "DIVERS": "Opération diverse",
};

const MODE_REGLEMENT_LABELS: Record<string, { label: string, isComptant: boolean }> = {
  "ESPECE": { label: "par espèces", isComptant: true },
  "CHEQUE": { label: "par chèque", isComptant: true },
  "VIREMENT": { label: "par virement", isComptant: true },
  "MOBILE": { label: "par mobile", isComptant: true },
  "CR": { label: "par crédit", isComptant: false },
};

const MONTANT_LABELS: Record<string, string> = {
  "TTC": "Montant Toutes Taxes Comprises",
  "HT": "Montant Hors Taxes",
  "TVA": "Montant TVA",
  "PAU": "Prix d'Achat Unitaire",
};

interface OperationComptableListViewProps {
  operations: OperationComptableDto[];
  isLoading: boolean;
  onSelectOperation: (id: string) => void;
  onEditOperation: (id: string) => void;
  onDeleteOperation: (operation: OperationComptableDto) => void;
  onAddNew?: () => void;
  onRefresh?: () => void;
  selectedId?: string;
  readOnly?: boolean;
  variant?: 'sentence' | 'detailed';
}

const RowActions = ({
  operation,
  onEdit,
  onDelete
}: {
  operation: OperationComptableDto,
  onEdit: (id: string) => void,
  onDelete: (operation: OperationComptableDto) => void
}) => (
  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(operation.id || '');
            }}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Modifier</p></TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(operation);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Supprimer</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export const OperationComptableListView: React.FC<OperationComptableListViewProps> = ({
  operations = [],
  isLoading,
  onSelectOperation,
  onEditOperation,
  onDeleteOperation,
  onAddNew,
  onRefresh,
  selectedId,
  readOnly = false,
  variant = 'sentence',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<CompteDto[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const res = await AccountingComptesService.getAllComptes();
      if (res.success && res.data) {
        setAccounts(res.data);
      }
    };
    fetchAccounts();
  }, []);

  const getAccountNumber = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId || acc.noCompte === accountId);
    return account ? account.noCompte : accountId;
  };

  const formatOperationAsContent = (op: OperationComptableDto) => {
    if (variant === 'detailed') {
      const accNumber = getAccountNumber(op.comptePrincipalId || '');
      const sensP = op.sensPrincipal === 'DEBIT' ? 'Débit' : 'Crédit';

      const typeOp = OPERATION_TEMPLATES[op.typeOperation] || op.typeOperation;
      const modeInfo = MODE_REGLEMENT_LABELS[op.modeReglement] || { label: `par ${op.modeReglement}`, isComptant: false };
      const montantLabel = MONTANT_LABELS[op.typeMontant] || op.typeMontant;

      return (
        <div className="flex flex-col gap-4 py-4 px-2">
          {/* Operation Header Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3 border-b border-gray-100">
            <Badge className="bg-blue-600 text-white border-none px-3 py-1 uppercase tracking-tighter">
              {typeOp}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{modeInfo.label}</span>
              <span className="text-gray-300">|</span>
              <span className="text-blue-600 font-medium">{montantLabel}</span>
            </div>
          </div>

          {/* Structured Account Table */}
          <div className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100/80 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200">
              <div className="col-span-3">Nature du Compte</div>
              <div className="col-span-5">Numéro de Compte</div>
              <div className="col-span-4 text-right">Sens de l'opération</div>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Principal Account Row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white transition-colors">
                <div className="col-span-3">
                  <span className="text-xs font-bold text-blue-900 uppercase">Principal</span>
                </div>
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded border border-gray-300 text-sm shadow-sm">{accNumber}</span>
                  </div>
                </div>
                <div className="col-span-4 text-right">
                  <Badge variant="outline" className={cn(
                    "font-bold px-3 py-0.5 border-2",
                    op.sensPrincipal === 'DEBIT' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {sensP}
                  </Badge>
                </div>
              </div>

              {/* Counterparty Rows */}
              {op.contreparties?.map((cp, idx) => {
                const cpAccNumber = getAccountNumber(cp.compteId || '');
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white transition-colors bg-blue-50/20">
                    <div className="col-span-3">
                      <span className="text-xs font-medium text-gray-500 italic uppercase">Contrepartie {idx + 1}</span>
                    </div>
                    <div className="col-span-5">
                      <span className="font-mono font-bold text-gray-700 bg-white px-2.5 py-1 rounded border border-gray-200 text-xs shadow-sm">{cpAccNumber}</span>
                    </div>
                    <div className="col-span-4 text-right">
                      <Badge variant="outline" className={cn(
                        "font-bold px-3 py-0.5 border opacity-80",
                        cp.sens === 'DEBIT' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {cp.sens === 'DEBIT' ? 'Débit' : 'Crédit'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Bottom Info */}
          {op.notes && (
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-100 shadow-inner">
              <span className="font-bold text-gray-400">NOTE:</span>
              <span className="italic leading-relaxed">{op.notes}</span>
            </div>
          )}
        </div>
      );
    }

    // Default 'sentence' variant
    const typeLabel = OPERATION_TEMPLATES[op.typeOperation] || op.typeOperation;
    const modeInfo = MODE_REGLEMENT_LABELS[op.modeReglement] || { label: `par ${op.modeReglement}`, isComptant: false };
    const comptantStr = modeInfo.isComptant ? "au comptant " : "";
    const action = op.sensPrincipal === 'DEBIT' ? 'on débite le compte' : 'on crédite le compte';
    const amount = MONTANT_LABELS[op.typeMontant] || `du Montant [${op.typeMontant}]`;
    const accNumber = getAccountNumber(op.comptePrincipalId || '');

    return (
      <span className="leading-relaxed font-medium">
        <span className="font-bold text-blue-700 uppercase">{typeLabel}</span> {comptantStr}{modeInfo.label}, {action} <span className="font-mono bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100 font-bold">{accNumber}</span> {amount}
      </span>
    );
  };

  const filteredOperations = operations.filter((op) => {
    const accNumber = getAccountNumber(op.comptePrincipalId);
    const content = `${OPERATION_TEMPLATES[op.typeOperation]} ${op.modeReglement} ${accNumber} ${op.typeMontant}`.toLowerCase();
    return content.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {!readOnly && (onAddNew || onRefresh) && (
        <div className="space-y-4">
          {/* Top Row: Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Bottom Row: Action buttons (New left, Refresh right) */}
          <div className="flex items-center justify-between">
            {onAddNew && (
              <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Opération
              </Button>
            )}
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="icon">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50 border-b">
            <TableRow>
              <TableHead className="font-bold text-gray-900 border-r">Détails de l'Opération (Compte & Sens)</TableHead>
              {!readOnly && <TableHead className="text-right font-bold text-gray-900 w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 1 : 2} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOperations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 1 : 2} className="text-center py-10 text-gray-400 border-2 border-dashed rounded-lg">
                  Aucune opération trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredOperations.map((operation) => (
                <TableRow
                  key={operation.id}
                  className={`group hover:bg-blue-50/50 cursor-pointer border-b transition-colors ${selectedId === operation.id ? 'bg-blue-100/50 shadow-sm border-blue-200' : ''}`}
                  onClick={() => onSelectOperation(operation.id || '')}
                >
                  <TableCell className="py-4 text-sm text-gray-700 border-r">
                    {formatOperationAsContent(operation)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-right py-4">
                      <RowActions
                        operation={operation}
                        onEdit={onEditOperation}
                        onDelete={onDeleteOperation}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};