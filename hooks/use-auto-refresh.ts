"use client";

import { useEffect, useRef } from "react";

/** Intervalle court pour le rafraîchissement AJAX automatique (ms). */
export const AUTO_REFRESH_INTERVAL_MS = 2500;

export type AutoRefreshOptions = {
  silent?: boolean;
};

export type AutoRefreshCallback = (options?: AutoRefreshOptions) => void | Promise<void>;

/**
 * Rafraîchit automatiquement les données via AJAX à intervalle régulier.
 * Les appels périodiques passent `{ silent: true }` pour éviter les loaders plein écran.
 */
export function useAutoRefresh(
  callback: AutoRefreshCallback,
  deps: React.DependencyList = [],
  options?: { intervalMs?: number; enabled?: boolean },
) {
  const { intervalMs = AUTO_REFRESH_INTERVAL_MS, enabled = true } = options ?? {};
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    const timer = window.setInterval(() => {
      void callbackRef.current({ silent: true });
    }, intervalMs);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
}
