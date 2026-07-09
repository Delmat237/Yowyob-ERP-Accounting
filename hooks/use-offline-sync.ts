"use client";

import { useEffect } from "react";
import { initEcrituresAnalytiquesStore } from "@/lib/analytique/ecritures-analytiques-store";
import { networkStatus } from "@/lib/offline/network-status";
import { flushOutbox } from "@/lib/offline/sync-engine";

export function useOfflineSync(): void {
    useEffect(() => {
        void initEcrituresAnalytiquesStore();

        const onOnline = () => {
            networkStatus.reportApiSuccess();
            void flushOutbox();
        };

        const interval = window.setInterval(() => {
            if (networkStatus.isOnline()) {
                void flushOutbox();
            }
        }, 30_000);

        window.addEventListener("online", onOnline);
        window.addEventListener("network:online", onOnline);

        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("network:online", onOnline);
            window.clearInterval(interval);
        };
    }, []);
}
