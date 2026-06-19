"use client";

import React, { useEffect, useState } from 'react';
import { EcritureComptableDto } from '@/src/lib2/models/EcritureComptableDto';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, Hash, Info, Notebook, Tag, Download, Paperclip, AlertCircle } from 'lucide-react';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import { AccountingAttachmentService } from '@/src/lib2/services/AccountingAttachmentService';
import { Button } from '@/components/ui/button';

interface EcritureComptableReadViewProps {
    ecriture: EcritureComptableDto;
}

// Extract rejection reason from notes field (stored as "[REJETÉ]: <reason>")
const getRejectionReason = (notes?: string | null): string | null => {
    if (!notes) return null;
    const marker = '[REJETÉ]: ';
    const idx = notes.indexOf(marker);
    if (idx === -1) return null;
    return notes.slice(idx + marker.length).trim() || null;
};

export const EcritureComptableReadView: React.FC<EcritureComptableReadViewProps> = ({ ecriture }) => {
    const [accounts, setAccounts] = useState<CompteDto[]>([]);
    const [selectedAttachment, setSelectedAttachment] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            const res = await AccountingComptesService.getAllComptes();
            if (res.success && res.data) {
                setAccounts(res.data);
            }
        };
        fetchAccounts();
    }, []);

    const getAccountNumber = (accountId: string) => {
        const account = accounts.find(acc => acc.id === accountId || acc.noCompte === accountId);
        return account ? account.noCompte : accountId;
    };

    const calculatedTotals = React.useMemo(() => {
        const totalDebit = ecriture.detailsEcriture?.reduce((sum, d) => sum + (Number(d.montantDebit) || 0), 0) || 0;
        const totalCredit = ecriture.detailsEcriture?.reduce((sum, d) => sum + (Number(d.montantCredit) || 0), 0) || 0;
        return { totalDebit, totalCredit };
    }, [ecriture.detailsEcriture]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Main Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Écriture Comptable</p>
                            <h2 className="text-2xl font-bold tracking-tight">{ecriture.libelle}</h2>
                        </div>
                        {(() => {
                            const rejectionReason = getRejectionReason(ecriture.notes);
                            if (ecriture.validee) {
                                return <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md">Validée</Badge>;
                            }
                            if (rejectionReason) {
                                return <Badge className="bg-red-500 text-white border-none shadow-lg gap-1"><AlertCircle className="h-3 w-3" />Rejeté</Badge>;
                            }
                            return <Badge className="bg-orange-500 text-white border-none shadow-lg">Brouillon</Badge>;
                        })()}
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date</p>
                            <p className="font-semibold text-gray-900">
                                {ecriture.dateEcriture ? format(new Date(ecriture.dateEcriture), 'dd MMMM yyyy', { locale: fr }) : '-'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Journal</p>
                            <p className="font-semibold text-indigo-700">{ecriture.journalComptableLibelle || ecriture.journalComptableId}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <Hash className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Référence</p>
                            <p className="font-semibold text-gray-900">{ecriture.referenceExterne || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Numéro</p>
                            <p className="font-mono font-semibold text-gray-700">{ecriture.numeroEcriture || 'EN ATTENTE'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rejection Banner */}
            {(() => {
                const rejectionReason = getRejectionReason(ecriture.notes);
                if (!rejectionReason) return null;
                // Strip the rejection part from notes for the banner
                const markerIdx = ecriture.notes ? ecriture.notes.indexOf('[REJETÉ]: ') : -1;
                const cleanNotes = markerIdx > 0 ? ecriture.notes!.slice(0, markerIdx).trim() : '';
                void markerIdx;
                return (
                    <>
                        {/* Rejection reason banner */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-4">
                            <div className="text-red-600 shrink-0">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1">Motif du rejet</p>
                                <p className="text-sm text-red-900 leading-relaxed whitespace-pre-wrap">{rejectionReason}</p>
                            </div>
                        </div>
                        {/* Other notes if any */}
                        {cleanNotes && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4">
                                <div className="text-blue-600 shrink-0">
                                    <Notebook className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Notes Internes</p>
                                    <p className="text-sm text-blue-900 leading-relaxed italic">{cleanNotes}</p>
                                </div>
                            </div>
                        )}
                    </>
                );
            })()}

            {/* Notes Section if exists (no rejection) */}
            {!getRejectionReason(ecriture.notes) && ecriture.notes && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4">
                    <div className="text-blue-600 shrink-0">
                        <Notebook className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Notes Internes</p>
                        <p className="text-sm text-blue-900 leading-relaxed italic">{ecriture.notes}</p>
                    </div>
                </div>
            )}

            {/* Details Table */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
                    <h3 className="text-xl font-bold text-gray-800">Lignes d'Écritures</h3>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                <TableHead className="font-bold text-gray-700 py-4 px-6">Compte</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4">Désignation</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 py-4">Débit</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 py-4 px-6">Crédit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ecriture.detailsEcriture?.map((detail: any, index) => (
                                <TableRow key={index} className="group hover:bg-blue-50/30 transition-all">
                                    <TableCell className="font-bold text-blue-800 px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {getAccountNumber(detail.compteComptableId)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{detail.libelle}</TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-emerald-600">
                                        {detail.montantDebit ? detail.montantDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0,00'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-rose-600 px-6">
                                        {detail.montantCredit ? detail.montantCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0,00'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <tfoot className="bg-gray-900 text-white">
                            <TableRow className="hover:bg-gray-900">
                                <TableCell colSpan={2} className="px-6 py-5 text-right">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mr-4">Total Équilibre</span>
                                </TableCell>
                                <TableCell className="text-right py-5">
                                    <div className="flex flex-col items-end">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Débit</span>
                                        <span className="font-mono font-bold text-lg text-emerald-400">
                                            {calculatedTotals.totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right px-6 py-5">
                                    <div className="flex flex-col items-end">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Crédit</span>
                                        <span className="font-mono font-bold text-lg text-rose-400">
                                            {calculatedTotals.totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </tfoot>
                    </Table>
                </div>
            </div>

            {/* Attachments Section */}
            {(() => {
                let files: { id: string, name: string }[] = [];
                if (ecriture.attachmentIds) {
                    try {
                        files = typeof ecriture.attachmentIds === 'string'
                            ? JSON.parse(ecriture.attachmentIds)
                            : ecriture.attachmentIds;
                    } catch (e) {
                        console.error('Failed to parse attachmentIds', e);
                    }
                }

                if (files && files.length > 0) {
                    return (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-1.5 bg-indigo-500 rounded-full" />
                                <h3 className="text-xl font-bold text-gray-800">Pièces Jointes</h3>
                                <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">{files.length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between p-4 cursor-pointer border rounded-xl shadow-sm transition-all group ${selectedAttachment?.id === file.id
                                            ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400 shadow-md'
                                            : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                            }`}
                                        onClick={() => setSelectedAttachment(file)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedAttachment?.id === file.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                                                }`}>
                                                <Paperclip className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={`text-sm font-semibold truncate ${selectedAttachment?.id === file.id ? 'text-indigo-900' : 'text-gray-700'
                                                    }`} title={file.name}>{file.name}</span>
                                                <span className={`text-xs ${selectedAttachment?.id === file.id ? 'text-indigo-600/80' : 'text-gray-400'
                                                    }`}>Document joint</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => window.open(AccountingAttachmentService.getDownloadUrl(file.id), '_blank')}
                                                title="Télécharger"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                            </div>

                            {selectedAttachment && (
                                <div className="mt-8 bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                    <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Paperclip className="h-4 w-4 shrink-0 opacity-80" />
                                            <span className="text-sm font-medium truncate">{selectedAttachment.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-indigo-100 hover:text-white hover:bg-indigo-500/50"
                                            onClick={() => setSelectedAttachment(null)}
                                        >
                                            Fermer
                                        </Button>
                                    </div>
                                    <div className="w-full h-[600px] bg-gray-100 relative items-center justify-center flex">
                                        {selectedAttachment.name.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) != null ? (
                                            <img
                                                src={AccountingAttachmentService.getDownloadUrl(selectedAttachment.id)}
                                                alt={selectedAttachment.name}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        ) : (
                                            <iframe
                                                src={AccountingAttachmentService.getDownloadUrl(selectedAttachment.id)}
                                                className="w-full h-full border-none"
                                                title={selectedAttachment.name}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }
                return null;
            })()}

            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    Cette vue est en lecture seule. Si l'écriture n'est pas validée, vous pouvez utiliser le bouton d'édition pour la modifier.
                </p>
            </div>
        </div>
    );
};
