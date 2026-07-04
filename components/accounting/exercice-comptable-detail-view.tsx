"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Package,
    FileText,
    BadgeCheck,
    BadgeX,
    Save,
    Lock
} from 'lucide-react';
import { AccountingPeriodsService } from '@/src/lib2/services/AccountingPeriodsService';
import { PeriodeComptableDto } from '@/src/lib2/models/PeriodeComptableDto';
import { ExerciceComptableDto } from '@/src/lib2/models/ExerciceComptableDto';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from '@/components/ui/table';

interface ExerciceComptableDetailViewProps {
    exercice: ExerciceComptableDto | null;
    onSave: (data: ExerciceComptableDto) => void;
    onClose: () => void;
    onBack: () => void;
    onEdit?: () => void;
    forceEdit?: boolean;
}

export const ExerciceComptableDetailView: React.FC<ExerciceComptableDetailViewProps> = ({
    exercice,
    onSave,
    onClose,
    onBack,
    onEdit,
    forceEdit = false,
}) => {
    const [periodes, setPeriodes] = useState<PeriodeComptableDto[]>([]);
    const [isLoadingPeriodes, setIsLoadingPeriodes] = useState(false);
    const [isEditing, setIsEditing] = useState(forceEdit || !exercice);

    const form = useForm<ExerciceComptableDto>({
        defaultValues: exercice || {
            code: '',
            libelle: '',
            date_debut: new Date().getFullYear() + '-01-01',
            date_fin: new Date().getFullYear() + '-12-31',
            cloture: false,
        },
    });

    useEffect(() => {
        setIsEditing(forceEdit || !exercice);
        if (exercice) {
            form.reset(exercice);
            fetchPeriodes();
        }
    }, [exercice, forceEdit]);

    const fetchPeriodes = async () => {
        if (!exercice?.id) return;
        setIsLoadingPeriodes(true);
        try {
            const res = await AccountingPeriodsService.getAllPeriodeComptables();
            if (res.success && res.data) {
                // Filtrer les périodes par exercice_id si disponible dans le DTO
                // Note : Certains APIs pourraient ne pas avoir exercice_id exposé directement
                // mais ici on assume qu'on veut voir les périodes liées.
                setPeriodes(res.data.filter(p => p.exercice_id === exercice.id));
            }
        } catch (error) {
            console.error("Failed to fetch periods:", error);
        } finally {
            setIsLoadingPeriodes(false);
        }
    };

    const onSubmit = (data: ExerciceComptableDto) => {
        onSave(data);
    };

    if (isLoadingPeriodes) {
        return <CustomPageLoader message="Chargement des périodes..." />;
    }

    if (!isEditing && exercice) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Header Info */}
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 p-2 rounded-lg text-white">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">Détails de l'Exercice</h3>
                                    <p className="text-sm text-blue-600/70 font-medium">Référence: {exercice.code}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={exercice.cloture ? "destructive" : "success"} className="px-3 py-1">
                                    {exercice.cloture ? (
                                        <><BadgeX className="mr-1.5 h-3.5 w-3.5" /> Clôturé</>
                                    ) : (
                                        <><BadgeCheck className="mr-1.5 h-3.5 w-3.5" /> Ouvert</>
                                    )}
                                </Badge>
                                {!exercice.cloture && onEdit && (
                                    <Button variant="outline" size="sm" onClick={onEdit} className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50">
                                        Modifier
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Libellé</p>
                                <p className="text-sm font-semibold text-blue-900">{exercice.libelle}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Date de Début</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-900 bg-white inline-flex px-2 py-1 rounded border border-blue-100">
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                    {exercice.date_debut}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Date de Fin</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-900 bg-white inline-flex px-2 py-1 rounded border border-blue-100">
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                    {exercice.date_fin}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Periods Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
                                <h3 className="text-xl font-bold text-gray-800 tracking-tight">Périodes Comptables</h3>
                            </div>
                            <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                {periodes.length} Période(s)
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50/80">
                                    <TableRow>
                                        <TableHead className="font-bold text-gray-700">Code</TableHead>
                                        <TableHead className="font-bold text-gray-700">Début</TableHead>
                                        <TableHead className="font-bold text-gray-700">Fin</TableHead>
                                        <TableHead className="font-bold text-gray-700">Statut</TableHead>
                                        <TableHead className="font-bold text-gray-700">Date Clôture</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {periodes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="h-10 w-10 text-gray-200" />
                                                    <p className="font-medium">Aucune période trouvée pour cet exercice.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        periodes.map((p) => (
                                            <TableRow key={p.id} className="hover:bg-gray-50/80 transition-colors">
                                                <TableCell className="font-mono font-bold text-blue-700">{p.code}</TableCell>
                                                <TableCell className="text-gray-600">{p.dateDebut}</TableCell>
                                                <TableCell className="text-gray-600">{p.dateFin}</TableCell>
                                                <TableCell>
                                                    <Badge variant={p.cloturee ? "destructive" : "success"} className="px-2 py-0">
                                                        {p.cloturee ? "Clôturée" : "Ouverte"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-500 italic text-xs">{p.dateCloture || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onBack} className="min-w-[100px] border-gray-300">
                        Fermer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-white">
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="flex items-center gap-3 border-b border-blue-100 pb-4 mb-2">
                        <div className="bg-blue-600 p-2 rounded-lg text-white font-bold">
                            <Package className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">
                            {exercice?.id ? "Modifier l'Exercice" : "Nouvel Exercice"}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="code"
                            rules={{ required: "Le code est requis" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-blue-900">Code <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="EX: 2025" disabled={exercice?.cloture} className="bg-white border-blue-200 focus:ring-blue-500" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="libelle"
                            rules={{ required: "Le libellé est requis" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-blue-900">Libellé <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="EX: Exercice 2025" disabled={exercice?.cloture} className="bg-white border-blue-200 focus:ring-blue-500" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="date_debut"
                            rules={{ required: "Requis" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-blue-900">Date de début <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} disabled={exercice?.cloture} className="bg-white border-blue-200 focus:ring-blue-500" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date_fin"
                            rules={{ required: "Requis" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-blue-900">Date de fin <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} disabled={exercice?.cloture} className="bg-white border-blue-200 focus:ring-blue-500" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="p-4 border-t flex justify-between gap-3 bg-gray-50">
                    <div>
                        {exercice && !exercice.cloture && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100"
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                Clôturer
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" type="button" onClick={onBack} className="min-w-[100px]">
                            Annuler
                        </Button>
                        {!exercice?.cloture && (
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">
                                <Save className="mr-2 h-4 w-4" />
                                <span>{form.formState.isSubmitting ? "Enregistrement..." : (exercice?.id ? "Enregistrer les modifications" : "Enregistrer")}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </Form>
    );
};
