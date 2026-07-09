"use client";

import { OfflineStatusIndicator } from "@/components/offline/offline-status-indicator";
import { useOfflineSync } from "@/hooks/use-offline-sync";

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    useOfflineSync();
    return (
        <>
            {children}
        </>
    );
}

export { OfflineStatusIndicator };
