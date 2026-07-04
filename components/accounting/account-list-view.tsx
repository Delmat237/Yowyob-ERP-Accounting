"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { PlanComptableDto } from '@/src/lib2/models/PlanComptableDto';
import { Edit, Trash2, RefreshCw, Search, Plus } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface AccountListViewProps {
  accounts: PlanComptableDto[];
  isLoading: boolean;
  onSelectAccount: (id: string) => void;
  onEditAccount: (id: string) => void;
  onDeleteAccount: (account: PlanComptableDto) => void;
  onAddNew: () => void;
  selectedId?: string;
  onInitPlan?: () => void;
  onImport?: () => void;
}

const RowActions = ({ account, onEdit, onDelete }: { account: PlanComptableDto, onEdit: (id: string) => void, onDelete: (account: PlanComptableDto) => void }) => {
  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      <TooltipProvider>
        <PermissionGuard feature="accounts" action="update">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(account.id || ''); }}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Modifier</p></TooltipContent>
          </Tooltip>
        </PermissionGuard>
        <PermissionGuard feature="accounts" action="delete">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(account); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Supprimer</p></TooltipContent>
          </Tooltip>
        </PermissionGuard>
      </TooltipProvider>
    </div>
  );
};

export const AccountListView: React.FC<AccountListViewProps> = ({
  accounts = [],
  isLoading,
  onSelectAccount,
  onEditAccount,
  onDeleteAccount,
  onAddNew,
  selectedId,
  onInitPlan,
  onImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter(account => {
        const matchesSearch =
          account.noCompte?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.libelle?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesClass = !classFilter || classFilter === 'all' || account.noCompte?.startsWith(classFilter);
        const matchesType = !typeFilter || typeFilter === 'all' || (account as any).type === typeFilter;

        return matchesSearch && matchesClass && matchesType;
      })
      .sort((a, b) => (a.noCompte || '').localeCompare(b.noCompte || ''));
  }, [accounts, searchQuery, classFilter, typeFilter]);

  if (isLoading) return <CustomPageLoader message="Chargement des comptes..." />;

  return (
    <div className="space-y-4">
      {/* Toolbar with search, filters, and buttons */}
      <div className="space-y-4">
        {/* Top Row: Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Rechercher par numero, libellé..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              <SelectItem value="1">Classe 1</SelectItem>
              <SelectItem value="2">Classe 2</SelectItem>
              <SelectItem value="3">Classe 3</SelectItem>
              <SelectItem value="4">Classe 4</SelectItem>
              <SelectItem value="5">Classe 5</SelectItem>
              <SelectItem value="6">Classe 6</SelectItem>
              <SelectItem value="7">Classe 7</SelectItem>
              <SelectItem value="8">Classe 8</SelectItem>
              <SelectItem value="9">Classe 9</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bottom Row: Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PermissionGuard feature="accounts" action="create">
              <Button
                onClick={onAddNew}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={accounts.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Compte
              </Button>
            </PermissionGuard>

            {accounts.length === 0 && onInitPlan && (
              <PermissionGuard feature="accounts" action="create">
                <Button
                  onClick={onInitPlan}
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Initialiser le Plan Comptable (OHADA 2025)
                </Button>
              </PermissionGuard>
            )}

            {onImport && (
              <PermissionGuard feature="accounts" action="create">
                <Button
                  onClick={onImport}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Importer un Plan
                </Button>
              </PermissionGuard>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900">N° Compte</TableHead>
              <TableHead className="font-bold text-gray-900">Libellé</TableHead>
              <TableHead className="font-bold text-gray-900">Type</TableHead>
              <TableHead className="font-bold text-gray-900">Classe</TableHead>
              <TableHead className="font-bold text-gray-900">Solde</TableHead>
              <TableHead className="font-bold text-gray-900">Statut</TableHead>
              <TableHead className="text-right font-bold text-gray-900 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400 border-2 border-dashed rounded-lg">
                  Aucun compte disponible.
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow
                  key={account.id}
                  className={`group hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedId === account.id ? 'bg-blue-100/50 shadow-sm border-blue-200' : ''}`}
                  onClick={() => onSelectAccount(account.id || '')}
                >
                  <TableCell className="font-mono font-bold text-gray-700">{account.noCompte}</TableCell>
                  <TableCell className="font-medium">{account.libelle}</TableCell>
                  <TableCell className="text-gray-500">{(account as any).type || '-'}</TableCell>
                  <TableCell className="text-gray-500">{account.classe || '-'}</TableCell>
                  <TableCell className="text-gray-500">-</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${account.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {account.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <RowActions account={account} onEdit={onEditAccount} onDelete={onDeleteAccount} />
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