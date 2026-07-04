// components/accounting/position-fiscale-list-view.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PositionFiscale, OperationType } from '@/types/accounting';
import { Edit, Trash2, Plus, Search, Receipt, ShoppingCart, Upload, Download, Percent } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PositionFiscaleListViewProps {
  positions: PositionFiscale[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (position: PositionFiscale) => void;
  onAddNew: () => void;
}

// Helper pour les icônes et labels
const operationTypeLabels: Record<OperationType, string> = {
  vente: 'Vente',
  achat: 'Achat',
  importation: 'Importation',
  exportation: 'Exportation',
  exonere: 'Exonéré'
};

const operationTypeIcons = {
  vente: <ShoppingCart className="h-4 w-4 text-blue-600" />,
  achat: <ShoppingCart className="h-4 w-4 text-green-600" />,
  importation: <Download className="h-4 w-4 text-purple-600" />,
  exportation: <Upload className="h-4 w-4 text-orange-600" />,
  exonere: <Percent className="h-4 w-4 text-gray-600" />
};

const operationTypeColors: Record<OperationType, string> = {
  vente: 'bg-blue-50 border-blue-200 text-blue-700',
  achat: 'bg-green-50 border-green-200 text-green-700',
  importation: 'bg-purple-50 border-purple-200 text-purple-700',
  exportation: 'bg-orange-50 border-orange-200 text-orange-700',
  exonere: 'bg-gray-50 border-gray-200 text-gray-700'
};

export const PositionFiscaleListView: React.FC<PositionFiscaleListViewProps> = ({
  positions = [],
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPositions = positions.filter((pos) =>
    pos.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operationTypeLabels[pos.typeOperation].toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <CustomPageLoader message="Chargement des positions fiscales..." />;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">Positions Fiscales</h2>
          <p className="text-gray-600">Gérez les positions fiscales pour vos opérations</p>
        </div>
      </div>

      {/* Barre de recherche et bouton Nouvelle Position */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une position fiscale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-300"
            />
          </div>
        </div>

        <Button
          onClick={onAddNew}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm sm:w-auto w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Position
        </Button>
      </div>

      {/* Statistiques */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-blue-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold">{positions.length}</span> position{positions.length !== 1 ? 's' : ''} fiscale{positions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-3 w-3 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold">{positions.filter(p => p.typeOperation === 'vente').length}</span> ventes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-3 w-3 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold">{positions.filter(p => p.typeOperation === 'achat').length}</span> achats
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="h-3 w-3 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold">{positions.filter(p => p.taxeLieeId).length}</span> avec taxe
            </span>
          </div>
        </div>
      </div>

      {/* Liste des positions fiscales */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50">
                <div className="col-span-5 font-semibold text-gray-700 text-sm">
                  Position Fiscale
                </div>
                <div className="col-span-3 font-semibold text-gray-700 text-sm">
                  Type d'Opération
                </div>
                <div className="col-span-2 font-semibold text-gray-700 text-sm">
                  Taxe
                </div>
                <div className="col-span-2 font-semibold text-gray-700 text-sm text-right">
                  Actions
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredPositions.length === 0 ? (
                <div className="h-40 flex items-center justify-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-gray-700 font-medium text-sm mb-1">Aucune position trouvée</p>
                    {searchTerm && (
                      <p className="text-gray-500 text-xs">
                        Aucun résultat pour "{searchTerm}"
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                filteredPositions.map((position) => (
                  <div
                    key={position.id}
                    className="group hover:bg-gray-50/50 px-4 py-3"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Nom et description */}
                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${operationTypeColors[position.typeOperation].split(' ')[0]}`}>
                            {operationTypeIcons[position.typeOperation]}
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-medium text-gray-900 text-sm">{position.name}</div>
                            {position.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {position.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Type d'opération avec badge */}
                      <div className="col-span-3">
                        <Badge
                          variant="outline"
                          className={`${operationTypeColors[position.typeOperation]} text-xs font-medium py-0.5 px-2`}
                        >
                          {operationTypeLabels[position.typeOperation]}
                        </Badge>
                      </div>

                      {/* Taxe associée */}
                      <div className="col-span-2">
                        {position.taxeLieeId ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-xs font-medium text-gray-700">Avec taxe</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            Sans taxe
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(position.id)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(position)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer de la liste */}
        {filteredPositions.length > 0 && (
          <div className="bg-gray-50 border-t px-4 py-2">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-xs text-gray-700">
                Affichage de <span className="font-semibold">{filteredPositions.length}</span> sur{' '}
                <span className="font-semibold">{positions.length}</span> positions
                {searchTerm && ' (recherche active)'}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span>Vente</span>
                </div>
                <div className="h-3 w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span>Achat</span>
                </div>
                <div className="h-3 w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <span>Importation</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};