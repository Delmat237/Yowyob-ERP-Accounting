import { DraftAccountingService } from '@/src/lib2/services/DraftAccountingService';
import { BrouillardComptableDto } from '@/src/lib2/models/BrouillardComptableDto';

export async function fetchBrouillardsByType(
  type: BrouillardComptableDto.type,
  size = 200,
): Promise<BrouillardComptableDto[]> {
  try {
    const rows = await DraftAccountingService.getAllBrouillards(undefined, type, 0, size);
    return rows ?? [];
  } catch {
    return [];
  }
}

export async function fetchClientSalesBrouillards(): Promise<BrouillardComptableDto[]> {
  const invoices = await fetchBrouillardsByType(BrouillardComptableDto.type.FACTURE_CLIENT);
  const other = await fetchBrouillardsByType(BrouillardComptableDto.type.AUTRE);
  return [...invoices, ...other].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
}

export function isCreditNote(row: BrouillardComptableDto): boolean {
  const label = (row.libelle ?? '').toLowerCase();
  const piece = (row.numeroPiece ?? '').toLowerCase();
  if (label.includes('avoir') || piece.includes('avoir')) return true;
  if ((row.montantTotal ?? 0) < 0) return true;
  const json = row.dataJson as Record<string, unknown> | undefined;
  const docType = String(json?.type ?? json?.documentType ?? '').toUpperCase();
  return docType.includes('AVOIR') || docType.includes('CREDIT');
}

export function filterCustomerInvoices(rows: BrouillardComptableDto[]): BrouillardComptableDto[] {
  return rows.filter(
    (row) =>
      row.type === BrouillardComptableDto.type.FACTURE_CLIENT && !isCreditNote(row),
  );
}

export function filterCreditNotes(rows: BrouillardComptableDto[]): BrouillardComptableDto[] {
  return rows.filter((row) => isCreditNote(row));
}

export async function fetchPaymentBrouillards(): Promise<BrouillardComptableDto[]> {
  const [cash, bank] = await Promise.all([
    fetchBrouillardsByType(BrouillardComptableDto.type.MOUVEMENT_CAISSE),
    fetchBrouillardsByType(BrouillardComptableDto.type.OPERATION_BANCAIRE),
  ]);
  return [...cash, ...bank].sort(
    (a, b) => new Date(b.datePiece ?? b.createdAt ?? 0).getTime() -
      new Date(a.datePiece ?? a.createdAt ?? 0).getTime(),
  );
}

export function formatBrouillardStatut(statut?: string): string {
  switch (statut) {
    case BrouillardComptableDto.statut.VALIDE:
      return 'Validé';
    case BrouillardComptableDto.statut.REJETE:
      return 'Rejeté';
    case BrouillardComptableDto.statut.EN_ATTENTE_VALIDATION:
      return 'En attente';
    default:
      return 'Brouillon';
  }
}
