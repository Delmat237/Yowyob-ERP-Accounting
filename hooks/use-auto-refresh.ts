"use client";

import { useEffect, useRef, useState } from "react";
import { networkStatus } from "@/lib/offline/network-status";

/** Intervalle court pour le rafraîchissement AJAX automatique (ms). */
export const AUTO_REFRESH_INTERVAL_MS = 30_000;

export type AutoRefreshOptions = {
  silent?: boolean;
};

export type AutoRefreshCallback = (options?: AutoRefreshOptions) => void | Promise<void>;

/**
 * Rafraîchit automatiquement les données via AJAX à intervalle régulier.
 * Les appels périodiques passent `{ silent: true }` pour éviter les loaders plein écran.
 * Le polling est suspendu automatiquement hors ligne.
 */
export function useAutoRefresh(
  callback: AutoRefreshCallback,
  deps: React.DependencyList = [],
  options?: { intervalMs?: number; enabled?: boolean },
) {
  const { intervalMs = AUTO_REFRESH_INTERVAL_MS, enabled = true } = options ?? {};
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const [isOnline, setIsOnline] = useState(() => networkStatus.isOnline());

  useEffect(() => {
    return networkStatus.subscribe((mode) => setIsOnline(mode === "online"));
  }, []);

  const effectiveEnabled = enabled && isOnline;

  useEffect(() => {
    if (!effectiveEnabled) return undefined;

    const timer = window.setInterval(() => {
      void callbackRef.current({ silent: true });
    }, intervalMs);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEnabled, intervalMs, ...deps]);

  useEffect(() => {
    const onSync = () => {
      void callbackRef.current({ silent: true });
    };
    window.addEventListener("sync:complete", onSync);
    return () => window.removeEventListener("sync:complete", onSync);
  }, []);
}
