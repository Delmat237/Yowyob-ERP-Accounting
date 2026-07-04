"use client";

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Layers, ChevronRight, ChevronDown, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { toast } from 'sonner';
import { useCompose } from '@/hooks/use-compose-store';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AnalyticalAccount {
    id: string;
    libelle: string;
    dateDebut?: string;
    dateFin?: string;
}

export interface AxeAnalytique {
    id: string;
    code: string;
    libelle: string;
    type: 'DEPARTEMENT' | 'PROJET' | 'PRODUIT' | 'ACTIVITE' | 'CENTRE_COUT';
    responsable?: string;
    actif: boolean;
    comptes?: AnalyticalAccount[];
}

interface AnalyticsListViewProps {
    axes: AxeAnalytique[];
    isLoading: boolean;
    onEdit: (id: string) => void;
    onView?: (id: string) => void;
    onDelete: (axe: AxeAnalytique) => void;
    onAddNew: () => void;
}

export function AnalyticsListView({
    axes,
    isLoading,
    onEdit,
    onView,
    onDelete,
    onAddNew
}: AnalyticsListViewProps) {
    const [expandedAxes, setExpandedAxes] = useState<string[]>([]);
    const { onOpen, onClose: closeCompose } = useCompose();

    const toggleAxe = (id: string) => {
        setExpandedAxes(prev =>
            prev.includes(id) ? prev.filter(axeId => axeId !== id) : [...prev, id]
        );
    };

    const handleOpenAddAccount = (axeId: string) => {
        const axe = axes.find(a => a.id === axeId);
        onOpen({
            title: `Nouveau Compte Analytique - ${axe?.libelle}`,
            content: (
                <div className="p-6 space-y-6 bg-white rounded-lg">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="account-name">Libellé du compte analytique <span className="text-red-500">*</span></Label>
                            <Input
                                id="account-name"
                                placeholder="Ex: Frais de déplacement - Projet X"
                                className="border-slate-300 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value;
                                        if (val) {
                                            toast.success(`Compte "${val}" créé`);
                                            closeCompose();
                                        }
                                    }
                                }}
                            />
                            <p className="text-xs text-slate-500 italic">Appuyez sur Entrée pour valider ou cliquez sur Créer.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={closeCompose} className="px-6 border-slate-300">Annuler</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                            onClick={() => {
                                const input = document.getElementById('account-name') as HTMLInputElement;
                                if (input.value) {
                                    toast.success(`Compte "${input.value}" créé`);
                                    closeCompose();
                                } else {
                                    toast.error('Veuillez saisir un libellé');
                                }
                            }}
                        >
                            Créer le compte
                        </Button>
                    </div>
                </div>
            )
        });
    };

    if (isLoading) {
        return <CustomPageLoader message="Chargement des axes analytiques..." />;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-medium text-slate-800">Axes et Comptes Analytiques</h3>
                <div className="flex gap-2">
                    <Button size="sm" onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" /> Nouvel Axe
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden overflow-x-auto shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Axe / Code</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {axes.map((axe) => {
                            const isExpanded = expandedAxes.includes(axe.id);
                            return (
                                <React.Fragment key={axe.id}>
                                    <TableRow className="hover:bg-slate-50 transition-colors">
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleAxe(axe.id)}>
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell
                                            className={onView ? "cursor-pointer" : ""}
                                            onClick={() => onView && onView(axe.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-50 rounded">
                                                    <Layers className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{axe.libelle}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{axe.code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                                {axe.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">{axe.responsable || 'Non assigné'}</TableCell>
                                        <TableCell>
                                            {axe.actif ? (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Actif</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500">Inactif</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-100 bg-blue-50/30 hover:bg-blue-50" onClick={() => {
                                                handleOpenAddAccount(axe.id);
                                            }} title="Ajouter un compte">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => onEdit(axe.id)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => onDelete(axe)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow className="bg-slate-50/50">
                                            <TableCell colSpan={6} className="p-0 border-b">
                                                <div className="px-14 py-4 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <Tag className="h-3 w-3" /> Comptes analytiques
                                                        </h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {[1, 2].map(_ => (
                                                            <div key={_} className="bg-white border rounded p-3 flex items-center justify-between shadow-sm group">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                                    <span className="text-sm font-medium text-slate-700">Compte Analytique {_}</span>
                                                                </div>
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600">
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500">
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="outline"
                                                            className="h-full py-3 border-slate-200 border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                                                            onClick={() => {
                                                                handleOpenAddAccount(axe.id);
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" /> Nouveau compte
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
