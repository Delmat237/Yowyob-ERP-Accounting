'use client';

import { useEffect, useState } from 'react';
import {
  initNetworkStatus,
  shouldUseOffline,
  subscribeNetworkStatus,
} from '@/lib/offline/network-status';
import { getPendingCount } from '@/lib/offline/outbox';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => !shouldUseOffline());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const teardownNetwork = initNetworkStatus();
    const refresh = () => {
      setIsOnline(!shouldUseOffline());
      void getPendingCount().then(setPendingCount);
    };

    refresh();
    const unsubscribe = subscribeNetworkStatus(() => refresh());
    const interval = window.setInterval(refresh, 5000);

    return () => {
      teardownNetwork();
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}
