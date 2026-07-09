import {
  offlineDb,
  type OutboxAction,
  type OutboxEntry,
  type OutboxStatus,
} from '@/lib/offline/db';

export type EnqueueMutationInput<T = unknown> = {
  entity: string;
  action: OutboxAction;
  entityId: string;
  payload: T;
  clientMutationId?: string;
};

export async function enqueueMutation<T>(input: EnqueueMutationInput<T>): Promise<OutboxEntry<T>> {
  const entry: OutboxEntry<T> = {
    id: crypto.randomUUID(),
    entity: input.entity,
    action: input.action,
    entityId: input.entityId,
    payload: input.payload,
    clientMutationId: input.clientMutationId ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    retries: 0,
    lastError: null,
  };
  await offlineDb.outbox.add(entry);
  return entry;
}

export async function getPendingOutboxEntries(): Promise<OutboxEntry[]> {
  return offlineDb.outbox
    .where('status')
    .anyOf(['pending', 'failed'])
    .filter((entry) => entry.retries < 5)
    .sortBy('createdAt');
}

export async function getPendingCount(): Promise<number> {
  const entries = await getPendingOutboxEntries();
  return entries.length;
}

export async function updateOutboxStatus(
  id: string,
  status: OutboxStatus,
  patch?: Partial<Pick<OutboxEntry, 'retries' | 'lastError'>>,
): Promise<void> {
  const row = await offlineDb.outbox.get(id);
  if (!row) return;
  await offlineDb.outbox.put({
    ...row,
    status,
    retries: patch?.retries ?? row.retries,
    lastError: patch?.lastError ?? row.lastError,
  });
}

export async function markOutboxSyncing(id: string): Promise<void> {
  await updateOutboxStatus(id, 'syncing');
}

export async function markOutboxDone(id: string): Promise<void> {
  await updateOutboxStatus(id, 'done', { lastError: null });
}

export async function markOutboxFailed(id: string, error: string, retries: number): Promise<void> {
  await updateOutboxStatus(id, 'failed', { lastError: error, retries });
}

export async function markOutboxConflict(id: string, error: string): Promise<void> {
  await updateOutboxStatus(id, 'conflict', { lastError: error });
}

export async function markOutboxPending(id: string, error: string, retries: number): Promise<void> {
  await updateOutboxStatus(id, 'pending', { lastError: error, retries });
}
