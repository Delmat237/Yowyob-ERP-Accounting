"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { BrouillardComptableDto } from '@/src/lib2/models/BrouillardComptableDto';
import { ClientDocumentListView } from '@/components/accounting/client-document-list-view';
import { fetchPaymentBrouillards } from '@/lib/accounting/client-brouillards';
import { toast } from 'sonner';

export default function ClientPaymentsPage() {
  const [rows, setRows] = useState<BrouillardComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    try {
      setRows(await fetchPaymentBrouillards());
    } catch {
      toast.error('Impossible de charger les paiements.');
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
      title="Paiements clients"
      description="Encaissements clients (caisse et banque) liés à la comptabilité générale."
      rows={rows}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      emptyLabel="Aucun paiement client enregistré."
      partnerLabel="Tiers"
    />
  );
}
