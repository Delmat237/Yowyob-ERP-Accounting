// components/accounting/mode-paiement-list-view.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModePaiement, ModePaiementType } from '@/types/accounting';
import { Edit, Trash2, Plus, Landmark, Wallet, Smartphone, CreditCard, Search, BarChart3 } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ModePaiementListViewProps {
  modes: ModePaiement[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (mode: ModePaiement) => void;
  onAddNew: () => void;
}

// Helper pour les icônes et labels
const modeTypeLabels: Record<ModePaiementType, string> = {
  banque: 'Banque',
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  autre: 'Autre'
};

const modeTypeIcons = {
  banque: <Landmark className="h-5 w-5 text-blue-600" />,
  especes: <Wallet className="h-5 w-5 text-green-600" />,
  mobile_money: <Smartphone className="h-5 w-5 text-purple-600" />,
  autre: <CreditCard className="h-5 w-5 text-gray-600" />
};

const modeTypeColors: Record<ModePaiementType, string> = {
  banque: 'bg-blue-50 border-blue-200 text-blue-700',
  especes: 'bg-green-50 border-green-200 text-green-700',
  mobile_money: 'bg-purple-50 border-purple-200 text-purple-700',
  autre: 'bg-gray-50 border-gray-200 text-gray-700'
};

export const ModePaiementListView: React.FC<ModePaiementListViewProps> = ({
  modes = [],
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModes = modes.filter((mode) =>
    mode.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <CustomPageLoader message="Chargement des modes de paiement..." />;

  return (
    <div className="space-y-6">
      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un mode de paiement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-300"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onAddNew}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm sm:w-auto w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Mode
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-blue-100">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold">{modes.length}</span> mode{modes.length !== 1 ? 's' : ''} de paiement
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold">{modes.filter(m => m.type === 'banque').length}</span> bancaires
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold">{modes.filter(m => m.type === 'especes').length}</span> espèces
            </span>
          </div>
        </div>
      </div>

      {/* Liste des modes de paiement */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50">
                <div className="col-span-5 font-semibold text-gray-700 text-sm">
                  Mode de Paiement
                </div>
                <div className="col-span-3 font-semibold text-gray-700 text-sm">
                  Type
                </div>
                <div className="col-span-3 font-semibold text-gray-700 text-sm">
                  Compte Associé
                </div>
                <div className="col-span-1 font-semibold text-gray-700 text-sm text-right">
                  Actions
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredModes.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-700 font-medium mb-2">Aucun mode trouvé</p>
                    {searchTerm && (
                      <p className="text-gray-500 text-sm">
                        Aucun résultat pour "{searchTerm}"
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                filteredModes.map((mode) => (
                  <div
                    key={mode.id}
                    className="group hover:bg-gray-50/50 px-6 py-4"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Nom du mode */}
                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${modeTypeColors[mode.type].split(' ')[0]}`}>
                            {modeTypeIcons[mode.type]}
                          </div>
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">{mode.name}</div>
                            <div className="text-xs text-gray-500">
                              ID: {mode.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Type avec badge */}
                      <div className="col-span-3">
                        <Badge
                          variant="outline"
                          className={`${modeTypeColors[mode.type]} text-xs font-medium`}
                        >
                          {modeTypeLabels[mode.type]}
                        </Badge>
                      </div>

                      {/* Compte associé */}
                      <div className="col-span-3">
                        {mode.journalId ? (
                          <div className="space-y-1">
                            <div className="font-mono text-sm font-medium text-gray-900">
                              {mode.journalId}
                            </div>
                            <div className="text-xs text-gray-500">
                              Compte comptable
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            Non spécifié
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(mode.id)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(mode)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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
        {filteredModes.length > 0 && (
          <div className="bg-gray-50 border-t px-6 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-700">
                Affichage de <span className="font-semibold">{filteredModes.length}</span> sur{' '}
                <span className="font-semibold">{modes.length}</span> modes de paiement
                {searchTerm && ' (recherche active)'}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Banque</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Espèces</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span>Mobile Money</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};