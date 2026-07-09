"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function OfflineStatusIndicator() {
    const { isOnline, pendingCount, isOffline } = useNetworkStatus();

    const showWarning = isOffline || pendingCount > 0;
    const label = isOffline
        ? "Hors ligne — vos modifications sont enregistrées localement"
        : pendingCount > 0
          ? `${pendingCount} élément(s) en attente de synchronisation`
          : "Connecté";

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className="relative inline-flex items-center justify-center h-8 w-8 rounded-md"
                        aria-label={label}
                    >
                        {isOffline ? (
                            <CloudOff className="h-4 w-4 text-amber-600" />
                        ) : pendingCount > 0 ? (
                            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                        ) : (
                            <Cloud className="h-4 w-4 text-emerald-600" />
                        )}
                        {showWarning && (
                            <span className="absolute mt-[-18px] ml-[14px] h-2 w-2 rounded-full bg-amber-500" />
                        )}
                    </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p className="text-xs">{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
