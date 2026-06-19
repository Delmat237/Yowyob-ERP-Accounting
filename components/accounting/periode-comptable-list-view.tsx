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
import { PeriodeComptableDto } from '@/src/lib2/models/PeriodeComptableDto';
import { Edit, Lock, RefreshCw, Search, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ExerciceComptableDto } from '@/src/lib2/models/ExerciceComptableDto';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface PeriodeComptableListViewProps {
  periodes: PeriodeComptableDto[];
  isLoading: boolean;
  onSelectPeriode: (id: string) => void;
  onEditPeriode: (id: string) => void;
  onClosePeriode: (id: string) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  exercices?: ExerciceComptableDto[];
  selectedId?: string;
}

const RowActions = ({ periode, onEdit, onClose }: {
  periode: PeriodeComptableDto;
  onEdit: (id: string) => void;
  onClose: (id: string) => void;
}) => {
  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      <TooltipProvider>
        {!periode.cloturee && (
          <PermissionGuard feature="periods" action="lock">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); onClose(periode.id || ''); }}>
                  <Lock className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Clôturer la période</p></TooltipContent>
            </Tooltip>
          </PermissionGuard>
        )}
        {!periode.cloturee && (
          <PermissionGuard feature="periods" action="lock">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(periode.id || ''); }}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Modifier</p></TooltipContent>
            </Tooltip>
          </PermissionGuard>
        )}
      </TooltipProvider>
    </div>
  );
};

export const PeriodeComptableListView: React.FC<PeriodeComptableListViewProps> = ({
  periodes = [],
  isLoading,
  onSelectPeriode,
  onEditPeriode,
  onClosePeriode,
  onAddNew,
  onRefresh,
  exercices = [],
  selectedId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');


  const getExerciceCode = (exerciceId?: string) => {
    if (!exerciceId) return '-';
    const ex = exercices.find(e => e.id === exerciceId);
    return ex ? ex.code : '-';
  };

  // Filter periodes
  const filteredPeriodes = useMemo(() => {
    return periodes.filter(periode => {
      const matchesSearch =
        periode.code?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [periodes, searchQuery]);

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
          <PermissionGuard feature="periods" action="lock">
            <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Période
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
              <TableHead className="font-bold text-gray-900">Exercice</TableHead>
              <TableHead className="font-bold text-gray-900">Date Début</TableHead>
              <TableHead className="font-bold text-gray-900">Date Fin</TableHead>
              <TableHead className="font-bold text-gray-900">Statut</TableHead>
              <TableHead className="text-right font-bold text-gray-900 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium italic">
                  Chargement des périodes...
                </TableCell>
              </TableRow>
            ) : filteredPeriodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium italic">Aucune période trouvée.</TableCell>
              </TableRow>
            ) : (
              filteredPeriodes.map((periode) => (
                <TableRow
                  key={periode.id}
                  className={`group hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedId === periode.id ? 'bg-blue-100/50 shadow-sm border-blue-200' : ''}`}
                  onClick={() => onSelectPeriode(periode.id || '')}
                >
                  <TableCell className="font-mono font-bold text-gray-700">{periode.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal border-blue-200 text-blue-700 bg-blue-50/50">
                      {getExerciceCode(periode.exercice_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{periode.dateDebut ? new Date(periode.dateDebut).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell className="text-gray-500">{periode.dateFin ? new Date(periode.dateFin).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={periode.cloturee ? 'secondary' : 'default'} className={periode.cloturee ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none'}>
                      {periode.cloturee ? 'Clôturée' : 'Ouverte'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <RowActions
                      periode={periode}
                      onEdit={onEditPeriode}
                      onClose={onClosePeriode}
                    />
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