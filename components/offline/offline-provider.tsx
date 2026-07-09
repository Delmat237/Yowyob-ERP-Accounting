'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { migrateEcrituresAnalytiquesFromLocalStorage } from '@/lib/offline/migrate-local-storage';
import type { SyncCompleteEvent } from '@/lib/offline/sync-engine';

type OfflineContextValue = {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSync: SyncCompleteEvent | null;
  syncNow: () => Promise<SyncCompleteEvent | null>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const offline = useOfflineSync();

  useEffect(() => {
    void migrateEcrituresAnalytiquesFromLocalStorage();
  }, []);

  const value = useMemo(
    () => ({
      isOnline: offline.isOnline,
      pendingCount: offline.pendingCount,
      isSyncing: offline.isSyncing,
      lastSync: offline.lastSync,
      syncNow: offline.syncNow,
    }),
    [offline],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline doit être utilisé dans OfflineProvider');
  }
  return ctx;
}
