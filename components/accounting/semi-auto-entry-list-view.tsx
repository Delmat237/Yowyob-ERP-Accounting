"use client";

import React from 'react';
import { CustomerInvoiceDto } from '@/src/lib2/models/CustomerInvoiceDto';
import { SupplierInvoiceDto } from '@/src/lib2/models/SupplierInvoiceDto';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface SemiAutoEntryListViewProps {
    invoices: (CustomerInvoiceDto | SupplierInvoiceDto)[];
    type: 'SALE' | 'PURCHASE';
    isLoading: boolean;
    onInvoiceDoubleClick: (invoice: CustomerInvoiceDto | SupplierInvoiceDto) => void;
}

export function SemiAutoEntryListView({
    invoices,
    type,
    isLoading,
    onInvoiceDoubleClick,
}: SemiAutoEntryListViewProps) {
    const formatCurrency = (amount?: number) => {
        if (!amount) return '0,00 FCFA';
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' FCFA';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const getPartnerName = (invoice: CustomerInvoiceDto | SupplierInvoiceDto) => {
        if (type === 'SALE') {
            return (invoice as CustomerInvoiceDto).nomClient || '-';
        } else {
            return (invoice as SupplierInvoiceDto).nomFournisseru || '-';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Chargement des factures...</p>
                </div>
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Aucune facture non comptabilisée
                </h3>
                <p className="text-gray-500 max-w-md">
                    Toutes les factures {type === 'SALE' ? 'clients' : 'fournisseurs'} de cette période ont été comptabilisées.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        Factures {type === 'SALE' ? 'Clients' : 'Fournisseurs'} Non Comptabilisées
                    </h3>
                    <p className="text-sm text-gray-500">
                        {invoices.length} facture{invoices.length > 1 ? 's' : ''} en attente de comptabilisation
                    </p>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {invoices.length} en attente
                </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">N° Facture</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">
                                {type === 'SALE' ? 'Client' : 'Fournisseur'}
                            </TableHead>
                            <TableHead className="font-semibold text-right">Montant HT</TableHead>
                            <TableHead className="font-semibold text-right">TVA</TableHead>
                            <TableHead className="font-semibold text-right">Montant TTC</TableHead>
                            <TableHead className="font-semibold">Mode Règlement</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow
                                key={invoice.idFacture}
                                className="cursor-pointer hover:bg-blue-50 transition-colors"
                                onDoubleClick={() => onInvoiceDoubleClick(invoice)}
                                title="Double-cliquez pour générer l'écriture comptable"
                            >
                                <TableCell className="font-medium text-blue-600">
                                    {invoice.numeroFacture || '-'}
                                </TableCell>
                                <TableCell>{formatDate(invoice.dateFacturation)}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {getPartnerName(invoice)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {formatCurrency(invoice.montantHT)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {formatCurrency(invoice.montantTVA)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(invoice.montantTTC)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="text-xs">
                                        {invoice.modeReglement || 'Non spécifié'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-900">Astuce</p>
                        <p className="text-sm text-blue-700 mt-1">
                            Double-cliquez sur une facture pour générer automatiquement l'écriture comptable correspondante.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
