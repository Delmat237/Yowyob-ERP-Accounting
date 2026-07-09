import {
  ENTITY_ECRITURE_ANALYTIQUE,
  updateEntitySyncStatus,
} from '@/lib/offline/db';
import { pushEcritureAnalytiqueOutboxEntry } from '@/lib/offline/handlers/ecriture-analytique-sync';
import { shouldUseOffline } from '@/lib/offline/network-status';
import {
  getPendingOutboxEntries,
  markOutboxConflict,
  markOutboxDone,
  markOutboxFailed,
  markOutboxPending,
  markOutboxSyncing,
} from '@/lib/offline/outbox';

export const SYNC_BACKOFF_MS = [0, 2000, 5000, 15000, 30000] as const;

export type SyncCompleteEvent = {
  synced: number;
  failed: number;
  conflicts: number;
  stoppedByNetwork: boolean;
};

type SyncListener = (event: SyncCompleteEvent) => void;
const syncListeners = new Set<SyncListener>();

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeSyncComplete(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

function emitSyncComplete(event: SyncCompleteEvent): void {
  syncListeners.forEach((listener) => listener(event));
}

function getBackoffDelay(retries: number): number {
  const index = Math.min(Math.max(retries, 0), SYNC_BACKOFF_MS.length - 1);
  return SYNC_BACKOFF_MS[index];
}

export function scheduleSyncRetry(retries: number): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
  }
  const delay = getBackoffDelay(retries);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushOutbox();
  }, delay);
}

export async function flushOutbox(): Promise<SyncCompleteEvent> {
  if (flushing || shouldUseOffline()) {
    return { synced: 0, failed: 0, conflicts: 0, stoppedByNetwork: shouldUseOffline() };
  }

  flushing = true;
  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  let stoppedByNetwork = false;

  try {
    const entries = await getPendingOutboxEntries();

    for (const entry of entries) {
      if (shouldUseOffline()) {
        stoppedByNetwork = true;
        break;
      }

      await markOutboxSyncing(entry.id);
      const result = await pushEcritureAnalytiqueOutboxEntry(entry);

      if (result.ok) {
        await markOutboxDone(entry.id);
        await updateEntitySyncStatus(entry.entity, entry.entityId, 'synced');
        synced += 1;
        continue;
      }

      if (result.network) {
        const retries = entry.retries + 1;
        await markOutboxPending(entry.id, result.message, retries);
        stoppedByNetwork = true;
        scheduleSyncRetry(retries);
        break;
      }

      if (result.conflict) {
        await markOutboxConflict(entry.id, result.message);
        conflicts += 1;
        continue;
      }

      await markOutboxFailed(entry.id, result.message, entry.retries + 1);
      failed += 1;
    }
  } finally {
    flushing = false;
  }

  const event: SyncCompleteEvent = { synced, failed, conflicts, stoppedByNetwork };
  emitSyncComplete(event);
  return event;
}

export function isFlushingOutbox(): boolean {
  return flushing;
}
