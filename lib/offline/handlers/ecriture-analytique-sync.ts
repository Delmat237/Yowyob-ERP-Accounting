import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapEcritureDtoToUi, mapEcritureUiToDto } from '@/lib/analytique/analytique-mappers';
import type { EcritureAnalytique } from '@/lib/analytique/ecriture-analytique';
import { buildLignesImputation } from '@/lib/analytique/ecriture-lignes';
import {
  ENTITY_ECRITURE_ANALYTIQUE,
  updateEntitySyncStatus,
  upsertEntity,
} from '@/lib/offline/db';
import {
  isApiNetworkResponse,
  isBusinessErrorStatus,
  isConflictStatus,
  isNetworkError,
  reportApiFailure,
  reportApiSuccess,
} from '@/lib/offline/network-status';
import type { OutboxEntry } from '@/lib/offline/db';
import { OpenAPI } from '@/src/lib2/core/OpenAPI';
import { request as apiRequest } from '@/src/lib2/core/request';
import type { ApiResponseWrapperEcritureAnalytiqueDto } from '@/src/lib2/models/ApiResponseWrapperEcritureAnalytiqueDto';
import type { EcritureAnalytiqueDto } from '@/src/lib2/models/EcritureAnalytiqueDto';

export type EcritureAnalytiqueOutboxPayload =
  | { kind: 'CREATE'; data: EcritureAnalytique; dto: EcritureAnalytiqueDto; clientMutationId: string }
  | { kind: 'VALIDATE'; entityId: string; serverId?: string; clientMutationId: string }
  | { kind: 'REJECT'; entityId: string; serverId?: string; reason: string; clientMutationId: string };

export type SyncPushResult =
  | { ok: true; ecriture?: EcritureAnalytique }
  | { ok: false; network: boolean; conflict: boolean; message: string };

async function requestWithIdempotency<T>(
  options: Parameters<typeof apiRequest>[1] & { idempotencyKey?: string },
): Promise<T> {
  const baseHeaders = await (typeof OpenAPI.HEADERS === 'function'
    ? OpenAPI.HEADERS({} as never)
    : Promise.resolve(OpenAPI.HEADERS ?? {}));

  const headers: Record<string, string> = { ...(baseHeaders as Record<string, string>) };
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  return apiRequest<T>(OpenAPI, {
    ...options,
    headers,
  });
}

async function pushCreate(payload: Extract<EcritureAnalytiqueOutboxPayload, { kind: 'CREATE' }>): Promise<SyncPushResult> {
  const dto: EcritureAnalytiqueDto = {
    ...payload.dto,
    clientId: payload.data.id,
    clientMutationId: payload.clientMutationId,
  };

  try {
    const response = await requestWithIdempotency<ApiResponseWrapperEcritureAnalytiqueDto>({
      method: 'POST',
      url: '/api/accounting/analytique/ecritures',
      body: dto,
      mediaType: 'application/json',
      idempotencyKey: payload.clientMutationId,
    });

    if (isApiNetworkResponse(response)) {
      reportApiFailure(true);
      return { ok: false, network: true, conflict: false, message: response.message ?? 'Erreur réseau' };
    }

    reportApiSuccess();
    const saved = mapEcritureDtoToUi(unwrapApiData(response, 'Synchronisation échouée.'));
    await upsertEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, 'synced');
    if (saved.id !== payload.data.id) {
      await upsertEntity(ENTITY_ECRITURE_ANALYTIQUE, payload.data.id, saved, 'synced');
    }
    return { ok: true, ecriture: saved };
  } catch (error: unknown) {
    if (isNetworkError(error)) {
      reportApiFailure(true);
      return { ok: false, network: true, conflict: false, message: error instanceof Error ? error.message : 'Erreur réseau' };
    }
    const status = (error as { status?: number })?.status ?? 0;
    if (isConflictStatus(status)) {
      return { ok: false, network: false, conflict: true, message: 'Conflit de version' };
    }
    if (isBusinessErrorStatus(status)) {
      return { ok: false, network: false, conflict: false, message: error instanceof Error ? error.message : 'Erreur métier' };
    }
    reportApiFailure(true);
    return { ok: false, network: true, conflict: false, message: error instanceof Error ? error.message : 'Erreur réseau' };
  }
}

async function pushValidate(payload: Extract<EcritureAnalytiqueOutboxPayload, { kind: 'VALIDATE' }>): Promise<SyncPushResult> {
  const targetId = payload.serverId ?? payload.entityId;
  try {
    const response = await requestWithIdempotency<ApiResponseWrapperEcritureAnalytiqueDto>({
      method: 'POST',
      url: '/api/accounting/analytique/ecritures/{id}/valider',
      path: { id: targetId },
      idempotencyKey: payload.clientMutationId,
    });

    if (isApiNetworkResponse(response)) {
      reportApiFailure(true);
      return { ok: false, network: true, conflict: false, message: response.message ?? 'Erreur réseau' };
    }

    reportApiSuccess();
    const saved = mapEcritureDtoToUi(unwrapApiData(response, 'Validation échouée.'));
    await upsertEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, 'synced');
    return { ok: true, ecriture: saved };
  } catch (error: unknown) {
    if (isNetworkError(error)) {
      reportApiFailure(true);
      return { ok: false, network: true, conflict: false, message: error instanceof Error ? error.message : 'Erreur réseau' };
    }
    const status = (error as { status?: number })?.status ?? 0;
    if (isConflictStatus(status)) {
      return { ok: false, network: false, conflict: true, message: 'Conflit de version' };
    }
    if (isBusinessErrorStatus(status)) {
      return { ok: false, network: false, conflict: false, message: error instanceof Error ? error.message : 'Erreur métier' };
    }
    reportApiFailure(true);
    return { ok: false, network: true, conflict: false, message: error instanceof Error ? error.message : 'Erreur réseau' };
  }
}

async function pushReject(payload: Extract<EcritureAnalytiqueOutboxPayload, { kind: 'REJECT' }>): Promise<SyncPushResult> {
  const targetId = payload.serverId ?? payload.entityId;
  try {
    const response = await requestWithIdempotency<ApiResponseWrapperEcritureAnalytiqueDto>({
      method: 'POST',
      url: '/api/accounting/analytique/ecritures/{id}/rejeter',
      path: { id: targetId },
      body: { raison: payload.reason },
      mediaType: 'application/json',
      idempotencyKey: payload.clientMutationId,
    });

    if (isApiNetworkResponse(response)) {
      reportApiFailure(true);
      return { ok: false, network: true, conflict: false, message: response.message ?? 'Erreur réseau' };
    }

    reportApiSuccess();
    const saved = mapEcritureDtoToUi(unwrapApiData(response, 'Rejet échoué.'));
    await upsertEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, 'synced');
    return { ok: true, ecriture: saved };
  } catch (error: unknown) {
    if (isNetworkError(error)) {
      reportApiFailure(true);
      return { ok: false, network: true, conflict: false, message: error instanceof Error ? error.message : 'Erreur réseau' };
    }
    const status = (error as { status?: number })?.status ?? 0;
    if (isConflictStatus(status)) {
      return { ok: false, network: false, conflict: true, message: 'Conflit de version' };
    }
    if (isBusinessErrorStatus(status)) {
      return { ok: false, network: false, conflict: false, message: error instanceof Error ? error.message : 'Erreur métier' };
    }
    reportApiFailure(true);
    return { ok: false, network: true, conflict: false, message: error instanceof Error ? error.message : 'Erreur réseau' };
  }
}

export async function pushEcritureAnalytiqueOutboxEntry(entry: OutboxEntry): Promise<SyncPushResult> {
  const payload = entry.payload as EcritureAnalytiqueOutboxPayload;

  if (payload.kind === 'CREATE') {
    return pushCreate(payload);
  }
  if (payload.kind === 'VALIDATE') {
    return pushValidate(payload);
  }
  if (payload.kind === 'REJECT') {
    return pushReject(payload);
  }

  return { ok: false, network: false, conflict: false, message: 'Opération non supportée' };
}

export function buildCreateOutboxPayload(
  data: EcritureAnalytique,
  clientMutationId: string,
): EcritureAnalytiqueOutboxPayload {
  const lignes = data.lignes?.length ? data.lignes : buildLignesImputation(data);
  const dto = mapEcritureUiToDto({ ...data, lignes });
  return {
    kind: 'CREATE',
    data: { ...data, lignes },
    dto: { ...dto, clientId: data.id, clientMutationId },
    clientMutationId,
  };
}

export async function markEcriturePending(entityId: string): Promise<void> {
  await updateEntitySyncStatus(ENTITY_ECRITURE_ANALYTIQUE, entityId, 'pending');
}

export async function markEcritureLocalOnly(entityId: string): Promise<void> {
  await updateEntitySyncStatus(ENTITY_ECRITURE_ANALYTIQUE, entityId, 'local_only');
}
