'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { probeApiHealth } from '@/lib/offline/network-status';
import {
  flushOutbox,
  subscribeSyncComplete,
  type SyncCompleteEvent,
} from '@/lib/offline/sync-engine';
import { getPendingCount } from '@/lib/offline/outbox';

export function useOfflineSync() {
  const { isOnline, pendingCount } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncCompleteEvent | null>(null);

  const refreshPending = useCallback(async () => {
    return getPendingCount();
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline) return null;
    setIsSyncing(true);
    try {
      const result = await flushOutbox();
      setLastSync(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return undefined;

    let cancelled = false;
    const run = async () => {
      const healthy = await probeApiHealth();
      if (!healthy || cancelled) return;
      setIsSyncing(true);
      try {
        const result = await flushOutbox();
        if (!cancelled) setLastSync(result);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  useEffect(() => {
    return subscribeSyncComplete((event) => {
      setLastSync(event);
    });
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSync,
    syncNow,
    refreshPending,
  };
}
