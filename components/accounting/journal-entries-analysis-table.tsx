// components/accounting/journal-entries-analysis-table.tsx
"use client";

import React, { useMemo, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table';
import { EcritureComptableDto } from '@/src/lib2/models/EcritureComptableDto';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';

interface JournalEntriesAnalysisTableProps {
    ecritures: EcritureComptableDto[];
    isLoading: boolean;
    accountMap?: Record<string, string>;
}

interface FlattenedRow {
    dateEc: Date | string;
    sens: 'D' | 'C';
    compte: string;
    intitule: string;
    debit: number;
    credit: number;
    piece: string;
    noSaisie: string;
}

export const JournalEntriesAnalysisTable: React.FC<JournalEntriesAnalysisTableProps> = React.memo(({
    ecritures = [],
    isLoading,
    accountMap = {},
}) => {
    // Utiliser useCallback pour stabiliser la fonction de calcul
    const computeFlattenedRows = useCallback((ecritures: EcritureComptableDto[], accountMap: Record<string, string>) => {
        const rows: FlattenedRow[] = [];

        // Estimer la taille totale pour optimisation
        let totalDetails = 0;
        for (let i = 0; i < ecritures.length; i++) {
            const ecriture = ecritures[i];
            if (ecriture.detailsEcriture) {
                totalDetails += ecriture.detailsEcriture.length;
            }
        }

        // Créer le tableau avec une capacité estimée (optionnel, pour les très grands datasets)
        // rows = new Array(totalDetails); // Cette approche n'est pas recommandée avec push()

        for (let i = 0; i < ecritures.length; i++) {
            const ecriture = ecritures[i];
            if (!ecriture.detailsEcriture || ecriture.detailsEcriture.length === 0) {
                continue;
            }

            const details = ecriture.detailsEcriture;
            for (let j = 0; j < details.length; j++) {
                const detail = details[j];
                const montantDebit = detail.montantDebit || 0;
                const montantCredit = detail.montantCredit || 0;

                rows.push({
                    dateEc: ecriture.dateEcriture,
                    sens: montantDebit > 0 ? 'D' : 'C',
                    compte: accountMap[detail.compteComptableId] || detail.compteComptableId,
                    intitule: detail.libelle || '',
                    debit: montantDebit,
                    credit: montantCredit,
                    piece: ecriture.libelle || '',
                    noSaisie: ecriture.numeroEcriture || (ecriture.id ? ecriture.id.slice(0, 8) : ''),
                });
            }
        }

        return rows;
    }, []);

    const flattenedRows = useMemo(() => {
        // Si pas d'écritures, retourner tableau vide immédiatement
        if (!ecritures || ecritures.length === 0) {
            return [];
        }
        return computeFlattenedRows(ecritures, accountMap);
    }, [ecritures, accountMap, computeFlattenedRows]);

    const totals = useMemo(() => {
        let debitTotal = 0;
        let creditTotal = 0;

        // Utiliser une boucle for classique pour de meilleures performances
        for (let i = 0; i < flattenedRows.length; i++) {
            const row = flattenedRows[i];
            debitTotal += row.debit;
            creditTotal += row.credit;
        }

        return { debit: debitTotal, credit: creditTotal };
    }, [flattenedRows]);

    // Optimiser le formatage des dates
    const formatDate = useCallback((date: Date | string) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('fr-FR');
        } catch {
            return '';
        }
    }, []);

    // Optimiser le formatage des nombres
    const formatNumber = useCallback((num: number) => {
        return num > 0 ? num.toLocaleString('fr-FR') : '0';
    }, []);

    if (isLoading) {
        return <CustomPageLoader message="Chargement de l'analyse du journal..." />;
    }

    if (!flattenedRows || flattenedRows.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-200 shadow-inner">
                Aucune écriture trouvée pour ce journal.
            </div>
        );
    }

    return (
        <div className="border border-blue-200 rounded-xl overflow-hidden shadow-md bg-white">
            {/* Table Header Section */}
            <div className="bg-blue-600 px-6 py-3 flex justify-between items-center text-white">
                <h3 className="font-bold text-sm uppercase tracking-wide">Journal détaillé</h3>
            </div>

            <div className="overflow-x-auto">
                <Table className="border-collapse">
                    <TableHeader className="bg-blue-100/80 border-b border-blue-200">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 border-r border-blue-200 px-4 w-[110px]">Date Ec</TableHead>
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 border-r border-blue-200 px-2 w-[50px] text-center">Se.</TableHead>
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 border-r border-blue-200 px-4 w-[130px]">Compte</TableHead>
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 border-r border-blue-200 px-4 min-w-[220px]">Intitulé écriture</TableHead>
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 border-r border-blue-200 px-4 w-[130px] text-right">Débit</TableHead>
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 border-r border-blue-200 px-4 w-[130px] text-right">Crédit</TableHead>
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 border-r border-blue-200 px-4 min-w-[180px]">Pièce</TableHead>
                            <TableHead className="font-bold text-blue-900 text-[11px] uppercase tracking-wider py-3 text-center px-4 w-[110px]">N° saisie</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flattenedRows.map((row, idx) => {
                            const isDebit = row.sens === 'D';

                            return (
                                <TableRow
                                    key={`${row.noSaisie}-${idx}-${row.compte}`}
                                    className="hover:bg-blue-50/50 transition-colors border-b border-gray-100 last:border-0 h-10"
                                >
                                    <TableCell className="py-2 px-4 text-xs font-medium text-gray-700 border-r border-gray-100">
                                        {formatDate(row.dateEc)}
                                    </TableCell>
                                    <TableCell className={`py-2 px-2 text-xs font-bold border-r border-gray-100 text-center ${isDebit ? 'text-red-600' : 'text-blue-700'}`}>
                                        {row.sens}
                                    </TableCell>
                                    <TableCell className={`py-2 px-4 text-xs font-mono border-r border-gray-100 font-semibold ${isDebit ? 'text-red-700' : 'text-blue-800'}`}>
                                        {row.compte}
                                    </TableCell>
                                    <TableCell className={`py-2 px-4 text-[11px] border-r border-gray-100 leading-tight ${isDebit ? 'text-red-700 font-bold uppercase' : 'text-gray-700 font-medium'}`}>
                                        {row.intitule}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-xs font-mono text-right border-r border-gray-100 text-red-600 font-bold bg-red-50/20">
                                        {formatNumber(row.debit)}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-xs font-mono text-right border-r border-gray-100 text-blue-800 font-bold bg-blue-50/20">
                                        {formatNumber(row.credit)}
                                    </TableCell>
                                    <TableCell
                                        className="py-2 px-4 text-[11px] text-gray-600 border-r border-gray-100 truncate max-w-[200px]"
                                        title={row.piece}
                                    >
                                        {row.piece}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-xs text-center font-mono text-gray-500 font-semibold">
                                        {row.noSaisie}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                    <tfoot className="bg-blue-600 text-white font-bold h-11 border-t-2 border-blue-700">
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={4} className="py-2 px-6 text-right text-xs font-bold uppercase tracking-widest">
                                Sommes totales
                            </TableCell>
                            <TableCell className="py-2 px-4 text-right font-mono text-sm border-l border-blue-500/50">
                                {totals.debit.toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell className="py-2 px-4 text-right font-mono text-sm border-l border-blue-500/50">
                                {totals.credit.toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell colSpan={2} className="border-l border-blue-500/50"></TableCell>
                        </TableRow>
                    </tfoot>
                </Table>
            </div>
        </div>
    );
});

JournalEntriesAnalysisTable.displayName = 'JournalEntriesAnalysisTable';