"use client";

import { BrouillardComptableDto } from '@/src/lib2/models/BrouillardComptableDto';
import { formatBrouillardStatut } from '@/lib/accounting/client-brouillards';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ClientDocumentListViewProps = {
  title: string;
  description: string;
  rows: BrouillardComptableDto[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  emptyLabel: string;
  partnerLabel?: string;
};

function partnerName(row: BrouillardComptableDto): string {
  const json = row.dataJson as Record<string, unknown> | undefined;
  return (
    String(json?.nomClient ?? json?.clientName ?? json?.tiers ?? '') ||
    row.libelle ||
    '—'
  );
}

function statutVariant(statut?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (statut === BrouillardComptableDto.statut.VALIDE) return 'default';
  if (statut === BrouillardComptableDto.statut.REJETE) return 'destructive';
  if (statut === BrouillardComptableDto.statut.EN_ATTENTE_VALIDATION) return 'secondary';
  return 'outline';
}

export function ClientDocumentListView({
  title,
  description,
  rows,
  isLoading,
  search,
  onSearchChange,
  emptyLabel,
  partnerLabel = 'Client',
}: ClientDocumentListViewProps) {
  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    return (
      (row.numeroPiece ?? '').toLowerCase().includes(q) ||
      (row.libelle ?? '').toLowerCase().includes(q) ||
      partnerName(row).toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Rechercher par n° pièce, libellé ou client…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° pièce</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>{partnerLabel}</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Écriture</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id ?? row.numeroPiece}>
                    <TableCell className="font-medium">{row.numeroPiece ?? '—'}</TableCell>
                    <TableCell>
                      {row.datePiece
                        ? format(new Date(row.datePiece), 'dd/MM/yyyy', { locale: fr })
                        : '—'}
                    </TableCell>
                    <TableCell>{partnerName(row)}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.libelle ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Math.abs(row.montantTotal ?? 0))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statutVariant(row.statut)}>
                        {formatBrouillardStatut(row.statut)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {row.ecritureNumero ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
