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
import { ExerciceComptableDto } from '@/src/lib2/models/ExerciceComptableDto';
import { Edit, Lock, Search, Plus } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface ExerciceComptableListViewProps {
    exercices: ExerciceComptableDto[];
    isLoading: boolean;
    onSelectExercice: (id: string) => void;
    onEditExercice: (id: string) => void;
    onCloseExercice: (id: string) => void;
    onAddNew: () => void;
    selectedId?: string;
}

const RowActions = ({ exercice, onEdit, onClose }: {
    exercice: ExerciceComptableDto;
    onEdit: (id: string) => void;
    onClose: (id: string) => void;
}) => {
    return (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <TooltipProvider>
                {!exercice.cloture && (
                    <PermissionGuard feature="periods" action="lock">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50" onClick={(e) => { e.stopPropagation(); onClose(exercice.id || ''); }}>
                                    <Lock className="h-4 w-4 text-blue-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Clôturer l'exercice</p></TooltipContent>
                        </Tooltip>
                    </PermissionGuard>
                )}
                {!exercice.cloture && (
                    <PermissionGuard feature="periods" action="lock">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50" onClick={(e) => { e.stopPropagation(); onEdit(exercice.id || ''); }}>
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

export const ExerciceComptableListView: React.FC<ExerciceComptableListViewProps> = ({
    exercices = [],
    isLoading,
    onSelectExercice,
    onEditExercice,
    onCloseExercice,
    onAddNew,
    selectedId,
}) => {
    const [searchQuery, setSearchQuery] = useState('');


    // Filter exercices
    const filteredExercices = useMemo(() => {
        return exercices.filter(exercice => {
            const matchesSearch =
                exercice.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exercice.libelle?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesSearch;
        });
    }, [exercices, searchQuery]);

    if (isLoading) return <CustomPageLoader message="Chargement des exercices..." />;

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

                {/* Bottom Row: Action buttons */}
                <div className="flex items-center justify-between">
                    <PermissionGuard feature="periods" action="lock">
                        <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvel Exercice
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="font-bold text-gray-900">Code</TableHead>
                            <TableHead className="font-bold text-gray-900">Libellé</TableHead>
                            <TableHead className="font-bold text-gray-900">Date Début</TableHead>
                            <TableHead className="font-bold text-gray-900">Date Fin</TableHead>
                            <TableHead className="font-bold text-gray-900 text-center">Statut</TableHead>
                            <TableHead className="text-right font-bold text-gray-900 px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredExercices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium italic">Aucun exercice trouvé.</TableCell>
                            </TableRow>
                        ) : (
                            filteredExercices.map((exercice) => (
                                <TableRow
                                    key={exercice.id}
                                    className={`group hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedId === exercice.id ? 'bg-blue-100/50 shadow-sm border-blue-200' : ''}`}
                                    onClick={() => onSelectExercice(exercice.id || '')}
                                >
                                    <TableCell className="font-mono font-bold text-gray-700">{exercice.code}</TableCell>
                                    <TableCell className="font-medium">{exercice.libelle}</TableCell>
                                    <TableCell className="text-gray-500">{exercice.date_debut ? new Date(exercice.date_debut).toLocaleDateString('fr-FR') : '-'}</TableCell>
                                    <TableCell className="text-gray-500">{exercice.date_fin ? new Date(exercice.date_fin).toLocaleDateString('fr-FR') : '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={exercice.cloture ? 'secondary' : 'default'} className={exercice.cloture ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-200'}>
                                            {exercice.cloture ? 'Clôturé' : 'Ouvert'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <RowActions
                                            exercice={exercice}
                                            onEdit={onEditExercice}
                                            onClose={onCloseExercice}
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
