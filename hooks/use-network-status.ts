"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { countPendingOutbox } from "@/lib/offline/outbox";
import { networkStatus, type NetworkMode } from "@/lib/offline/network-status";

function subscribe(callback: () => void): () => void {
    const unsubNetwork = networkStatus.subscribe(callback);
    if (typeof window !== "undefined") {
        window.addEventListener("sync:complete", callback);
        window.addEventListener("online", callback);
        window.addEventListener("offline", callback);
    }
    return () => {
        unsubNetwork();
        if (typeof window !== "undefined") {
            window.removeEventListener("sync:complete", callback);
            window.removeEventListener("online", callback);
            window.removeEventListener("offline", callback);
        }
    };
}

function getSnapshot(): NetworkMode {
    return networkStatus.getMode();
}

export function useNetworkStatus() {
    const mode = useSyncExternalStore(subscribe, getSnapshot, () => "online" as NetworkMode);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        let active = true;
        const refresh = async () => {
            const count = await countPendingOutbox();
            if (active) setPendingCount(count);
        };
        void refresh();
        const onSync = () => void refresh();
        window.addEventListener("sync:complete", onSync);
        return () => {
            active = false;
            window.removeEventListener("sync:complete", onSync);
        };
    }, [mode]);

    return {
        isOnline: mode === "online",
        mode,
        pendingCount,
        isOffline: mode === "offline",
    };
}
