"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { BrouillardComptableDto } from '@/src/lib2/models/BrouillardComptableDto';
import { ClientDocumentListView } from '@/components/accounting/client-document-list-view';
import {
  fetchClientSalesBrouillards,
  filterCustomerInvoices,
} from '@/lib/accounting/client-brouillards';
import { toast } from 'sonner';

export default function ClientInvoicesPage() {
  const [rows, setRows] = useState<BrouillardComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    try {
      const all = await fetchClientSalesBrouillards();
      setRows(filterCustomerInvoices(all));
    } catch {
      toast.error('Impossible de charger les factures clients.');
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
      title="Factures clients"
      description="Factures de vente enregistrées dans la comptabilité générale (brouillards et pièces validées)."
      rows={rows}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      emptyLabel="Aucune facture client pour le moment."
    />
  );
}
