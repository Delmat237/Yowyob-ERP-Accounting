"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { BrouillardComptableDto } from '@/src/lib2/models/BrouillardComptableDto';
import { ClientDocumentListView } from '@/components/accounting/client-document-list-view';
import { fetchBrouillardsByType } from '@/lib/accounting/client-brouillards';
import { toast } from 'sonner';

export default function SupplierInvoicesPage() {
  const [rows, setRows] = useState<BrouillardComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    try {
      setRows(await fetchBrouillardsByType(BrouillardComptableDto.type.FACTURE_FOURNISSEUR));
    } catch {
      toast.error('Impossible de charger les factures fournisseurs.');
      setRows([]);
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(load, [load]);

  return (
    <ClientDocumentListView
      title="Factures fournisseurs"
      description="Factures d'achat enregistrées dans la comptabilité générale."
      rows={rows}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      emptyLabel="Aucune facture fournisseur pour le moment."
      partnerLabel="Fournisseur"
    />
  );
}
