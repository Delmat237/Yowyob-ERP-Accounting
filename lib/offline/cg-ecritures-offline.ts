import { mutateWithOfflineOutbox } from "@/lib/offline/mutate-with-outbox";
import { CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import {
    getCachedList,
    removeFromCachedList,
    setCachedList,
    upsertInCachedList,
} from "@/lib/offline/list-cache";
import { isOfflineClientId, newOfflineEcritureId } from "@/lib/offline/id-map";
import { ENTITY_ECRITURE_COMPTABLE, type OfflinePendingMeta } from "@/lib/offline/types";
import { AccountingEntriesService } from "@/src/lib2/services/AccountingEntriesService";
import type { EcritureComptableDto } from "@/src/lib2/models/EcritureComptableDto";

export type EcritureComptableOfflineDto = EcritureComptableDto & OfflinePendingMeta;

const ECriture_LIST_KEYS = [
    CG_CACHE_KEYS.ECRITURES,
    CG_CACHE_KEYS.ECRITURES_NON_VALIDATED,
] as const;

function markPending(entry: EcritureComptableDto): EcritureComptableOfflineDto {
    return {
        ...entry,
        validee: entry.validee ?? false,
        statut: entry.statut ?? "BROUILLON",
        _offlinePending: true,
        _clientId: entry.id,
    };
}

async function upsertInAllEcritureCaches(entry: EcritureComptableOfflineDto): Promise<void> {
    await Promise.all(ECriture_LIST_KEYS.map((key) => upsertInCachedList(key, entry)));
}

async function removeFromAllEcritureCaches(entityId: string): Promise<void> {
    await Promise.all(ECriture_LIST_KEYS.map((key) => removeFromCachedList(key, entityId)));
}

/** Sauvegarde une écriture CG (create ou update), online ou en file d'attente. */
export async function saveEcritureComptableOffline(
    data: EcritureComptableDto,
): Promise<{ queued: boolean; entry: EcritureComptableOfflineDto }> {
    const isNew = !data.id || isOfflineClientId(data.id);
    const entityId = isNew ? newOfflineEcritureId() : data.id!;
    const entry = markPending({
        ...data,
        id: entityId,
        validee: false,
        actif: data.actif ?? true,
    });

    const result = await mutateWithOfflineOutbox({
        entity: ENTITY_ECRITURE_COMPTABLE,
        action: isNew ? "CREATE" : "UPDATE",
        entityId,
        payload: entry,
        clientMutationId: `save-${entityId}`,
        onlineMutator: () =>
            isNew
                ? AccountingEntriesService.createEcriture(
                      stripOfflineMeta(entry) as EcritureComptableDto,
                  )
                : AccountingEntriesService.updateEcriture(entityId, stripOfflineMeta(entry)),
        onQueued: async () => {
            await upsertInAllEcritureCaches(entry);
        },
    });

    if (!result.queued && result.data) {
        const saved = result.data as EcritureComptableDto;
        await upsertInAllEcritureCaches({ ...saved, _offlinePending: false });
        return { queued: false, entry: saved };
    }

    return { queued: true, entry };
}

export async function validateEcritureComptableOffline(
    id: string,
): Promise<{ queued: boolean }> {
    const cached = await getCachedList<EcritureComptableDto[]>(CG_CACHE_KEYS.ECRITURES);
    const entry = cached?.data.find((e) => e.id === id);

    const result = await mutateWithOfflineOutbox({
        entity: ENTITY_ECRITURE_COMPTABLE,
        action: "VALIDATE",
        entityId: id,
        payload: { id },
        clientMutationId: `validate-${id}`,
        onlineMutator: () => AccountingEntriesService.validateEcriture(id),
        onQueued: async () => {
            if (entry) {
                await removeFromCachedList(CG_CACHE_KEYS.ECRITURES_NON_VALIDATED, id);
                await upsertInCachedList(CG_CACHE_KEYS.ECRITURES, {
                    ...entry,
                    validee: true,
                    statut: "VALIDEE",
                    _offlinePending: true,
                });
            }
        },
    });

    if (!result.queued && entry) {
        await removeFromCachedList(CG_CACHE_KEYS.ECRITURES_NON_VALIDATED, id);
    }

    return { queued: result.queued };
}

export async function deleteEcritureComptableOffline(id: string): Promise<{ queued: boolean }> {
    const result = await mutateWithOfflineOutbox({
        entity: ENTITY_ECRITURE_COMPTABLE,
        action: "DELETE",
        entityId: id,
        payload: { id },
        clientMutationId: `delete-${id}`,
        onlineMutator: () => AccountingEntriesService.delete(id),
        onQueued: async () => {
            await removeFromAllEcritureCaches(id);
        },
    });
    return { queued: result.queued };
}

export async function deactivateEcritureComptableOffline(id: string): Promise<{ queued: boolean }> {
    const cached = await getCachedList<EcritureComptableDto[]>(CG_CACHE_KEYS.ECRITURES);
    const entry = cached?.data.find((e) => e.id === id);

    const result = await mutateWithOfflineOutbox({
        entity: ENTITY_ECRITURE_COMPTABLE,
        action: "DEACTIVATE",
        entityId: id,
        payload: { id },
        clientMutationId: `deactivate-${id}`,
        onlineMutator: () => AccountingEntriesService.deactivate(id),
        onQueued: async () => {
            if (entry) {
                const deactivated = markPending({ ...entry, actif: false });
                await upsertInCachedList(CG_CACHE_KEYS.ECRITURES, deactivated);
                await removeFromCachedList(CG_CACHE_KEYS.ECRITURES_NON_VALIDATED, id);
            }
        },
    });
    return { queued: result.queued };
}

export async function rejectEcritureComptableOffline(
    entry: EcritureComptableDto,
    reason: string,
): Promise<{ queued: boolean }> {
    const updatedEntry = markPending({
        ...entry,
        notes: `${entry.notes || ""}\n[REJETÉ]: ${reason}`.trim(),
        actif: false,
    });

    const updateResult = await mutateWithOfflineOutbox({
        entity: ENTITY_ECRITURE_COMPTABLE,
        action: "UPDATE",
        entityId: entry.id!,
        payload: updatedEntry,
        clientMutationId: `reject-update-${entry.id}`,
        onlineMutator: () =>
            AccountingEntriesService.updateEcriture(entry.id!, stripOfflineMeta(updatedEntry)),
        onQueued: async () => {
            await removeFromCachedList(CG_CACHE_KEYS.ECRITURES_NON_VALIDATED, entry.id!);
            await upsertInCachedList(CG_CACHE_KEYS.ECRITURES, updatedEntry);
        },
    });

    if (updateResult.queued) {
        return { queued: true };
    }

    const deactivateResult = await deactivateEcritureComptableOffline(entry.id!);
    return { queued: deactivateResult.queued };
}

function stripOfflineMeta(entry: EcritureComptableOfflineDto): EcritureComptableDto {
    const { _offlinePending, _clientId, ...rest } = entry;
    if (isOfflineClientId(rest.id)) {
        const { id: _removed, ...withoutId } = rest;
        return withoutId as EcritureComptableDto;
    }
    return rest;
}

/** Met à jour le cache liste après un fetch réussi (évite d'écraser les pending). */
export async function mergeServerEcrituresIntoCache(
    serverList: EcritureComptableDto[],
): Promise<EcritureComptableDto[]> {
    const cached = await getCachedList<EcritureComptableDto[]>(CG_CACHE_KEYS.ECRITURES);
    const pendingLocal = (cached?.data ?? []).filter(
        (e) => (e as EcritureComptableOfflineDto)._offlinePending,
    );
    const serverIds = new Set(serverList.map((e) => e.id));
    const merged = [
        ...pendingLocal.filter((p) => !serverIds.has(p.id)),
        ...serverList,
    ];
    await setCachedList(CG_CACHE_KEYS.ECRITURES, merged);
    const nonValidated = merged.filter((e) => !e.validee && e.actif !== false);
    await setCachedList(CG_CACHE_KEYS.ECRITURES_NON_VALIDATED, nonValidated);
    return merged;
}
