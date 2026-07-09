'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOffline } from '@/components/offline/offline-provider';
import { cn } from '@/lib/utils';

export function OfflineStatusIndicator() {
  const { isOnline, pendingCount, isSyncing } = useOffline();

  const hasPending = pendingCount > 0;
  const isWarning = !isOnline || hasPending || isSyncing;

  const tooltip = !isOnline
    ? 'Hors ligne — vos modifications seront synchronisées au retour de la connexion'
    : hasPending
      ? `${pendingCount} élément(s) en attente de synchronisation`
      : isSyncing
        ? 'Synchronisation en cours…'
        : 'En ligne';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center justify-center h-8 w-8"
            aria-label={tooltip}
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors',
                isWarning ? 'bg-orange-500' : 'bg-emerald-500',
                isSyncing && 'animate-pulse',
              )}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[240px]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
