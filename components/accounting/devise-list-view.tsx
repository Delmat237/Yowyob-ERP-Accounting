// components/accounting/devise-list-view.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Devise } from '@/types/accounting';
import { Edit, Trash2, Plus, RefreshCw, Search, Info, Calculator, Archive, X, Check, ArrowRightLeft } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Input } from '@/components/ui/input';
import { PermissionGuard } from '@/components/auth/permission-guard';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface DeviseListViewProps {
    devises: Devise[];
    isLoading: boolean;
    onEdit: (id: string) => void;
    onDelete: (devise: Devise) => void;
    onAddNew: () => void;
    onUpdateRate: (id: string) => void;
}

export const DeviseListView: React.FC<DeviseListViewProps> = ({
    devises = [],
    isLoading,
    onEdit,
    onDelete,
    onAddNew,
    onUpdateRate,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDevises = devises.filter((devise) =>
        (devise.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (devise.code ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const nationalCurrency = devises.find(d => d.estNationale);

    if (isLoading) return <CustomPageLoader message="Chargement des devises..." />;

    return (
        <div className="space-y-6">
            {/* Barre de recherche et actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher par code, nom ou symbole..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white border-gray-300"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <PermissionGuard feature="devises" action="create">
                        <Button
                            onClick={onAddNew}
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm sm:w-auto w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle devise
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {!nationalCurrency && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded text-blue-600">
                        <Info className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-800">Aucune devise nationale définie</p>
                        <p className="text-xs text-blue-700 mt-1">
                            Veuillez marquer une devise comme "Nationale" pour établir une base de référence pour les taux de change.
                        </p>
                    </div>
                </div>
            )}

            {/* Statistiques */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-blue-100">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium text-gray-700">
                            <span className="font-bold">{devises.length}</span> devise{devises.length !== 1 ? 's' : ''} au total
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-700">
                            <span className="font-bold">Devise nationale:</span> {nationalCurrency?.code || 'Non définie'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm font-medium text-gray-700">
                            <span className="font-bold">Taux dynamiques</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Tableau avec espacement amélioré */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-full">
                        <Table className="w-full">
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="py-4 px-6 font-semibold text-gray-700 w-1/5">
                                        <div className="text-left">Code ISO</div>
                                    </TableHead>
                                    <TableHead className="py-4 px-6 font-semibold text-gray-700 w-1/5">
                                        <div className="text-left">Symbole / Statut</div>
                                    </TableHead>
                                    <TableHead className="py-4 px-6 font-semibold text-gray-700 w-1/4">
                                        <div className="text-left">Nom</div>
                                    </TableHead>
                                    <TableHead className="py-4 px-6 font-semibold text-gray-700 w-1/4">
                                        <div className="text-right">Taux ({nationalCurrency?.code || '???'})</div>
                                    </TableHead>
                                    <TableHead className="py-4 px-6 font-semibold text-gray-700 w-[220px]">
                                        <div className="text-right">Actions</div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredDevises.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="h-10 w-10 text-gray-300 mb-3" />
                                                <p className="text-gray-700 font-medium mb-2">Aucune devise trouvée</p>
                                                {searchTerm && (
                                                    <p className="text-gray-500 text-sm">
                                                        Aucun résultat pour "{searchTerm}"
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDevises.map((devise) => (
                                        <TableRow key={devise.id} className={`hover:bg-gray-50/50 border-b border-gray-100 ${!devise.isActive ? 'opacity-60' : ''}`}>
                                            <TableCell className="py-3 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`
                            flex items-center justify-center h-12 w-12 rounded-lg
                            ${devise.estNationale
                                                            ? 'bg-green-50 border border-green-200'
                                                            : 'bg-blue-50 border border-blue-200'
                                                        }
                          `}>
                                                        <span className={`
                              font-bold text-base
                               ${devise.estNationale ? 'text-green-800' : 'text-blue-800'}
                            `}>
                                                            {devise.code}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{devise.code}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">ISO 4217</div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3 px-6">
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-medium">{devise.symbol}</div>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {devise.estNationale && (
                                                            <div className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                                                Nationale
                                                            </div>
                                                        )}
                                                        {!devise.isActive && (
                                                            <div className="text-[10px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full w-fit">
                                                                Inactive
                                                            </div>
                                                        )}
                                                        {devise.isActive && (
                                                            <div className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                                                Active
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3 px-6">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{devise.name}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {devise.name}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3 px-6">
                                                <div className="space-y-1 text-right">
                                                    <div className="font-mono font-bold text-gray-900 text-base">
                                                        {typeof devise.rate === 'number'
                                                            ? devise.rate.toLocaleString('fr-FR', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 6
                                                            })
                                                            : devise.rate}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        1 {devise.code} = {devise.rate} {nationalCurrency?.code || ''}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3 px-6">
                                                <div className="flex justify-end gap-2 text-right">
                                                    {!devise.estNationale && (
                                                        <PermissionGuard feature="devises" action="update">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => onUpdateRate(devise.id)}
                                                                className="h-8 px-3 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs"
                                                            >
                                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                                Taux
                                                            </Button>
                                                        </PermissionGuard>
                                                    )}
                                                    <PermissionGuard feature="devises" action="update">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => onEdit(devise.id)}
                                                            className="h-8 px-3 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs"
                                                        >
                                                            <Edit className="h-3 w-3 mr-1" />
                                                        </Button>
                                                    </PermissionGuard>
                                                    {!devise.estNationale && (
                                                        <PermissionGuard feature="devises" action="delete">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => onDelete(devise)}
                                                                className="h-8 px-3 border-red-200 text-red-700 hover:bg-red-50 text-xs"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </PermissionGuard>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer du tableau */}
                {filteredDevises.length > 0 && (
                    <div className="bg-gray-50 border-t px-6 py-3">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="text-sm text-gray-700">
                                Affichage de <span className="font-semibold">{filteredDevises.length}</span> sur{' '}
                                <span className="font-semibold">{devises.length}</span> devises
                                {searchTerm && ' (recherche active)'}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>Devise nationale</span>
                                </div>
                                <div className="h-4 w-px bg-gray-300"></div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span>Devises étrangères</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};