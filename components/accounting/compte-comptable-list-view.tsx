"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import { Edit, Plus, RefreshCw, Eye, Trash2, Loader2 } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface CompteComptableListViewProps {
    comptes: CompteDto[];
    isLoading: boolean;
    onSelectCompte: (id: string) => void;
    onEditCompte: (id: string) => void;
    onDeleteCompte: (id: string) => void;
    onAddNew?: () => void;
    onRefresh?: () => void;
    selectedId?: string;
}

const RowActions = ({
    compte,
    onView,
    onEdit,
    onDelete
}: {
    compte: CompteDto,
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => void
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
                            onView(compte.id || '');
                        }}
                    >
                        <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Voir les détails</TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <PermissionGuard feature="accounts" action="update">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(compte.id || '');
                            }}
                        >
                            <Edit className="h-4 w-4 text-green-600" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Modifier</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </PermissionGuard>
        <PermissionGuard feature="accounts" action="delete">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(compte.id || '');
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </PermissionGuard>
    </div>
);

export const CompteComptableListView: React.FC<CompteComptableListViewProps> = ({
    comptes,
    isLoading,
    onSelectCompte,
    onEditCompte,
    onDeleteCompte,
    onAddNew,
    onRefresh,
    selectedId,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClasse, setSelectedClasse] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

    // Extract unique classes and types from comptes
    const uniqueClasses = Array.from(new Set(comptes.map(c => c.classe).filter(c => c !== undefined && c !== null)))
        .sort((a, b) => a - b);

    const uniqueTypes = Array.from(new Set(comptes.map(c => c.typeCompte).filter(t => t !== undefined && t !== null && t !== '')))
        .sort();

    const filteredComptes = comptes.filter((compte) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            compte.noCompte?.toLowerCase().includes(search) ||
            compte.libelle?.toLowerCase().includes(search) ||
            compte.typeCompte?.toLowerCase().includes(search)
        );

        const matchesClasse = selectedClasse === 'all' || compte.classe?.toString() === selectedClasse;
        const matchesType = selectedType === 'all' || compte.typeCompte === selectedType;

        return matchesSearch && matchesClasse && matchesType;
    });

    return (
        <div className="space-y-4">
            {/* Top row: Nouveau Compte button on left, Refresh button on right */}
            <div className="flex items-center justify-between">
                <div>
                    {onAddNew && (
                        <PermissionGuard feature="accounts" action="create">
                            <Button size="sm" onClick={onAddNew} className="bg-[#007bff] hover:bg-[#0069d9]">
                                <Plus className="h-4 w-4 mr-2" />
                                Nouveau Compte
                            </Button>
                        </PermissionGuard>
                    )}
                </div>
                <div>
                    {onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Search and filters row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Input
                    placeholder="Rechercher par numéro, libellé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                />
                <Select value={selectedClasse} onValueChange={setSelectedClasse}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Classe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les classes</SelectItem>
                        {uniqueClasses.map((classe) => (
                            <SelectItem key={classe} value={classe.toString()}>
                                Classe {classe}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {uniqueTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg overflow-hidden overflow-x-auto bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">N° Compte</TableHead>
                            <TableHead className="font-semibold">Libellé</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Classe</TableHead>
                            <TableHead className="font-semibold">Solde</TableHead>
                            <TableHead className="font-semibold">Statut</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                    <div className="flex justify-center items-center py-4">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    </div>
                                    <span className="sr-only">Chargement des comptes...</span>
                                </TableCell>
                            </TableRow>
                        ) : filteredComptes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                    {searchTerm ? 'Aucun compte trouvé pour cette recherche.' : 'Aucun compte disponible.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredComptes.map((compte) => (
                                <TableRow
                                    key={compte.id}
                                    className={`group cursor-pointer hover:bg-blue-50/50 transition-colors ${selectedId === compte.id ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => onSelectCompte(compte.id || '')}
                                >
                                    <TableCell className="font-mono font-bold text-sm">{compte.noCompte}</TableCell>
                                    <TableCell className="font-medium">{compte.libelle}</TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600">{compte.typeCompte || '-'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600">{compte.classe || '-'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${(compte.solde || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {compte.solde?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0.00'} FCFA
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={compte.actif ? 'default' : 'secondary'} className={
                                            compte.actif
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                        }>
                                            {compte.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <RowActions
                                            compte={compte}
                                            onView={onSelectCompte}
                                            onEdit={onEditCompte}
                                            onDelete={onDeleteCompte}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && filteredComptes.length > 0 && (
                <div className="text-sm text-gray-500 text-center">
                    {filteredComptes.length} compte(s) affiché(s) sur {comptes.length} au total
                </div>
            )}
        </div>
    );
};
