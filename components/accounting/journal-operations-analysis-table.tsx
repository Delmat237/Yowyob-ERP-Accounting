// components/accounting/journal-operations-analysis-table.tsx
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
import { OperationComptableDto } from '@/src/lib2/models/OperationComptableDto';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';

interface JournalOperationsAnalysisTableProps {
    operations: OperationComptableDto[];
    isLoading: boolean;
    accountMap?: Record<string, string>;
}

interface FlattenedOpRow {
    typeOp: string;
    modeReglement: string;
    typeMontant: string;
    compte: string;
    sens: 'D' | 'C';
    nature: 'PRINCIPAL' | 'CONTREPARTIE'
}

const OPERATION_LABELS: Record<string, string> = {
    "VENTE": "Vente",
    "ACHAT": "Achat",
    "SALAIRE": "Salaire",
    "PAIEMENT": "Paiement",
    "DIVERS": "Divers",
};

export const JournalOperationsAnalysisTable: React.FC<JournalOperationsAnalysisTableProps> = React.memo(({
    operations = [],
    isLoading,
    accountMap = {},
}) => {
    const flattenedRows = useMemo(() => {
        const rows: FlattenedOpRow[] = [];

        for (const op of operations) {
            // Row for Principal Account
            rows.push({
                typeOp: OPERATION_LABELS[op.typeOperation] || op.typeOperation,
                modeReglement: op.modeReglement,
                typeMontant: op.typeMontant,
                compte: accountMap[op.comptePrincipalId] || op.comptePrincipalId,
                sens: op.sensPrincipal === 'DEBIT' ? 'D' : 'C',
                nature: 'PRINCIPAL'
            });

            // Rows for Counterparties
            if (op.contreparties) {
                for (const cp of op.contreparties) {
                    rows.push({
                        typeOp: OPERATION_LABELS[op.typeOperation] || op.typeOperation,
                        modeReglement: op.modeReglement,
                        typeMontant: op.typeMontant,
                        compte: accountMap[cp.compteId] || cp.compteId,
                        sens: cp.sens === 'DEBIT' ? 'D' : 'C',
                        nature: 'CONTREPARTIE',
                    });
                }
            }
        }

        return rows;
    }, [operations, accountMap]);

    if (isLoading) {
        return <CustomPageLoader message="Chargement de l'analyse des opérations..." />;
    }

    if (flattenedRows.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Aucune opération configurée pour ce journal.
            </div>
        );
    }

    return (
        <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-md bg-white">
            <div className="bg-indigo-600 px-6 py-3 flex justify-between items-center text-white">
                <h3 className="font-bold text-sm uppercase tracking-wide">Modèles d'opérations</h3>
            </div>

            <div className="overflow-x-auto">
                <Table className="border-collapse">
                    <TableHeader className="bg-indigo-50 border-b border-indigo-100">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider py-3 border-r border-indigo-100 px-4 w-[120px]">Type Op.</TableHead>
                            <TableHead className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider py-3 border-r border-indigo-100 px-4 w-[120px]">Règlement</TableHead>
                            <TableHead className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider py-3 border-r border-indigo-100 px-2 w-[50px] text-center">Se.</TableHead>
                            <TableHead className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider py-3 border-r border-indigo-100 px-4 w-[130px]">Compte</TableHead>
                            <TableHead className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider py-3 border-r border-indigo-100 px-4 w-[120px]">Nature</TableHead>
                            <TableHead className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider py-3 border-r border-indigo-100 px-4">Montant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flattenedRows.map((row, idx) => {
                            const isDebit = row.sens === 'D';
                            const isPrincipal = row.nature === 'PRINCIPAL';

                            return (
                                <TableRow
                                    key={idx}
                                    className={`hover:bg-indigo-50/30 transition-colors border-b border-gray-100 last:border-0 h-10 ${isPrincipal ? 'bg-white font-semibold' : 'bg-indigo-50/10'}`}
                                >
                                    <TableCell className="py-2 px-4 text-xs font-bold text-indigo-800 border-r border-gray-100">
                                        {isPrincipal ? row.typeOp : ''}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-xs text-gray-600 border-r border-gray-100">
                                        {isPrincipal ? row.modeReglement : ''}
                                    </TableCell>
                                    <TableCell className={`py-2 px-2 text-xs font-bold border-r border-gray-100 text-center ${isDebit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {row.sens}
                                    </TableCell>
                                    <TableCell className={`py-2 px-4 text-xs font-mono border-r border-gray-100 ${isDebit ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {row.compte}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[10px] border-r border-gray-100 uppercase tracking-tighter">
                                        <span className={`px-2 py-0.5 rounded-full ${isPrincipal ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {row.nature}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-700 border-r border-gray-100">
                                        {isPrincipal ? row.typeMontant : ''}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});

JournalOperationsAnalysisTable.displayName = 'JournalOperationsAnalysisTable';
