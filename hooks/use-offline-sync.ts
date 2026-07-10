"use client";

import { useEffect } from "react";
import { initEcrituresAnalytiquesStore } from "@/lib/analytique/ecritures-analytiques-store";
import { networkStatus } from "@/lib/offline/network-status";
import { pullSyncChanges } from "@/lib/offline/pull-sync";
import { flushOutbox } from "@/lib/offline/sync-engine";

async function syncOnReconnect(): Promise<void> {
    networkStatus.reportApiSuccess();
    try {
        await pullSyncChanges();
    } catch (err) {
        console.warn("[offline] pull sync skipped:", err);
    }
    await flushOutbox();
}

export function useOfflineSync(): void {
    useEffect(() => {
        void initEcrituresAnalytiquesStore();

        const onOnline = () => {
            void syncOnReconnect();
        };

        const interval = window.setInterval(() => {
            if (networkStatus.isOnline()) {
                void flushOutbox();
            }
        }, 30_000);

        window.addEventListener("online", onOnline);
        window.addEventListener("network:online", onOnline);

        // Premier pull + flush au montage si online
        if (networkStatus.isOnline()) {
            void syncOnReconnect();
        }

        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("network:online", onOnline);
            window.clearInterval(interval);
        };
    }, []);
}
