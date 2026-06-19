// components/accounting/journal-comptable-list-view.tsx
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
import { JournalComptableDto } from '@/src/lib2/models/JournalComptableDto';
import { Edit, Trash2, RefreshCw, Search, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface JournalComptableListViewProps {
  journals: JournalComptableDto[];
  isLoading: boolean;
  onSelectJournal: (id: string) => void;
  onEditJournal: (id: string) => void;
  onDeleteJournal: (journal: JournalComptableDto) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  selectedId?: string;
}

const RowActions = ({ journal, onEdit, onDelete }: {
  journal: JournalComptableDto,
  onEdit: (id: string) => void,
  onDelete: (journal: JournalComptableDto) => void
}) => {
  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      <TooltipProvider>
        <PermissionGuard feature="journals" action="update">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(journal.id!); }}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Modifier le journal</p></TooltipContent>
          </Tooltip>
        </PermissionGuard>
        <PermissionGuard feature="journals" action="delete">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(journal); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Supprimer le journal</p></TooltipContent>
          </Tooltip>
        </PermissionGuard>
      </TooltipProvider>
    </div>
  );
};

export const JournalComptableListView: React.FC<JournalComptableListViewProps> = ({
  journals = [],
  isLoading,
  onSelectJournal,
  onEditJournal,
  onDeleteJournal,
  onAddNew,
  onRefresh,
  selectedId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');


  // Filter journals
  const filteredJournals = useMemo(() => {
    return journals.filter(journal => {
      const matchesSearch =
        journal.codeJournal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journal.libelle?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [journals, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Toolbar with search, filters, and buttons */}
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

        {/* Bottom Row: Action buttons (New left, Refresh right) */}
        <div className="flex items-center justify-between">
          <PermissionGuard feature="journals" action="create">
            <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Journal
            </Button>
          </PermissionGuard>
          <Button onClick={onRefresh} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900">Code</TableHead>
              <TableHead className="font-bold text-gray-900">Libellé</TableHead>
              <TableHead className="font-bold text-gray-900">Type</TableHead>
              <TableHead className="font-bold text-gray-900">Statut</TableHead>
              <TableHead className="text-right font-bold text-gray-900 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-400 font-medium italic">
                  Chargement des journaux...
                </TableCell>
              </TableRow>
            ) : filteredJournals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-400 font-medium italic">Aucun journal trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredJournals.map((journal) => (
                <TableRow
                  key={journal.id}
                  className={`group hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedId === journal.id ? 'bg-blue-100/50 shadow-sm border-blue-200' : ''}`}
                  onClick={() => onSelectJournal(journal.id!)}
                >
                  <TableCell className="font-mono font-bold text-gray-700">{journal.codeJournal}</TableCell>
                  <TableCell className="font-medium">{journal.libelle}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal border-blue-200 text-blue-700 bg-blue-50/50">
                      {journal.typeJournal}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={journal.actif ? 'default' : 'secondary'} className={journal.actif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}>
                      {journal.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <RowActions journal={journal} onEdit={onEditJournal} onDelete={onDeleteJournal} />
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