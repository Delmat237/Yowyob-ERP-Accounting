import { CG_CACHE_KEYS, CA_CACHE_KEYS, SETTINGS_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { getCachedList, setCachedList } from "@/lib/offline/list-cache";
import { listPendingOutbox } from "@/lib/offline/outbox";
import type { OfflinePendingMeta, OutboxOperation } from "@/lib/offline/types";

/** Entités outbox associées à une clé de liste cache. */
const CACHE_KEY_ENTITIES: Record<string, string[]> = {
    [CG_CACHE_KEYS.OPERATIONS]: ["cg.operations"],
    [CG_CACHE_KEYS.TAXES]: ["cg.taxes"],
    [CG_CACHE_KEYS.DEVISES]: ["cg.devises", "cg.devises_rates"],
    [CG_CACHE_KEYS.JOURNAUX]: ["cg.journaux"],
    [CG_CACHE_KEYS.PLAN_COMPTABLE]: ["cg.plan_comptable"],
    [CG_CACHE_KEYS.COMPTES]: ["cg.comptes"],
    [CG_CACHE_KEYS.EXERCICES]: ["cg.exercices"],
    [CG_CACHE_KEYS.BUDGETS]: ["cg.budgets"],
    [CG_CACHE_KEYS.PERIODES]: ["cg.periodes"],
    [CG_CACHE_KEYS.ECRITURES]: ["ecriture_comptable"],
    [CG_CACHE_KEYS.ECRITURES_NON_VALIDATED]: ["ecriture_comptable"],
    [SETTINGS_CACHE_KEYS.NOTIFICATIONS]: ["notifications"],
    [CA_CACHE_KEYS.CENTRES]: ["ca.centres"],
    [CA_CACHE_KEYS.CHARGES]: ["ca.charges"],
    [CA_CACHE_KEYS.COMPTES]: ["ca.comptes"],
    [CA_CACHE_KEYS.PLAN_COMPTES]: ["ca.plan_comptes"],
    [CA_CACHE_KEYS.JOURNAUX]: ["ca.journaux"],
};

type ListItem = { id?: string; name?: string; code?: string; rate?: number } & OfflinePendingMeta;

function entitiesForCacheKey(cacheKey: string): string[] {
    return CACHE_KEY_ENTITIES[cacheKey] ?? [];
}

type DeviseViewCache = {
    id?: string;
    name?: string;
    code?: string;
    symbol?: string;
    rate?: number;
    estNationale?: boolean;
    isActive?: boolean;
};

/** Convertit un payload API (DeviseDto) en objet affiché (Devise). */
function devisePayloadToViewItem(
    payload: Record<string, unknown>,
    fromCache: DeviseViewCache | undefined,
    entityId: string,
): DeviseViewCache {
    if (typeof payload.name === "string") {
        return { ...fromCache, ...payload, id: entityId } as DeviseViewCache;
    }
    return {
        id: (payload.id as string) ?? entityId ?? fromCache?.id,
        name: (payload.nom as string) ?? fromCache?.name ?? "",
        code: (payload.code as string) ?? fromCache?.code ?? "",
        symbol: (payload.symbole as string) ?? fromCache?.symbol ?? "",
        rate: fromCache?.rate ?? 0,
        estNationale: (payload.est_nationale as boolean) ?? fromCache?.estNationale ?? false,
        isActive: (payload.actif as boolean) ?? fromCache?.isActive ?? true,
    };
}

function applyDeviseRateOp<T extends ListItem>(list: T[], op: OutboxOperation): T[] {
    const payload = op.payload as { sourceId?: string; rate?: number };
    const sourceId = payload.sourceId ?? op.entityId.split(":")[0];
    if (!sourceId) return list;

    return list.map((item) =>
        item.id === sourceId
            ? ({
                  ...item,
                  rate: payload.rate ?? item.rate,
                  _offlinePending: true,
                  _clientId: item.id,
              } as T)
            : item,
    );
}

function applyOutboxToList<T extends ListItem>(
    list: T[],
    ops: OutboxOperation[],
    cachedList: T[],
): T[] {
    let merged = [...list];

    for (const op of ops) {
        if (op.entity === "cg.devises_rates") {
            if (op.action !== "DELETE") {
                merged = applyDeviseRateOp(merged, op);
            }
            continue;
        }

        if (op.entity === "cg.periodes") {
            if (op.action === "DELETE") {
                merged = merged.filter((item) => item.id !== op.entityId);
                continue;
            }

            const fromCache = cachedList.find((item) => item.id === op.entityId) as
                | (ListItem & { code?: string; cloturee?: boolean; dateDebut?: string; dateFin?: string; exercice_id?: string })
                | undefined;
            const payload = op.payload as Record<string, unknown>;
            const item = {
                ...(fromCache ?? {}),
                ...payload,
                id: op.entityId,
                code: (payload.code as string) ?? fromCache?.code ?? "",
                cloturee: (payload.cloturee as boolean) ?? fromCache?.cloturee ?? false,
                dateDebut: (payload.dateDebut as string) ?? fromCache?.dateDebut ?? "",
                dateFin: (payload.dateFin as string) ?? fromCache?.dateFin ?? "",
                exercice_id: (payload.exercice_id as string) ?? fromCache?.exercice_id,
                _offlinePending: true,
                _clientId: op.entityId,
            } as T;

            const idx = merged.findIndex((entry) => entry.id === op.entityId);
            if (idx >= 0) merged[idx] = item;
            else merged.unshift(item);
            continue;
        }

        if (op.entity === "cg.devises") {
            if (op.action === "DELETE") {
                merged = merged.filter((item) => item.id !== op.entityId);
                continue;
            }

            const fromCache = cachedList.find((item) => item.id === op.entityId);
            const viewItem = devisePayloadToViewItem(
                op.payload as Record<string, unknown>,
                fromCache as DeviseViewCache | undefined,
                op.entityId,
            );
            const item = {
                ...viewItem,
                id: op.entityId,
                _offlinePending: true,
                _clientId: op.entityId,
            } as T;

            const idx = merged.findIndex((entry) => entry.id === op.entityId);
            if (idx >= 0) merged[idx] = item;
            else merged.unshift(item);
            continue;
        }

        if (op.action === "DELETE") {
            merged = merged.filter((item) => item.id !== op.entityId);
            continue;
        }

        const fromCache = cachedList.find((item) => item.id === op.entityId);
        const payload = op.payload as T;
        const base = fromCache ?? { ...payload, id: op.entityId };
        const item = {
            ...base,
            id: op.entityId,
            _offlinePending: true,
            _clientId: op.entityId,
        } as T;

        const idx = merged.findIndex((entry) => entry.id === op.entityId);
        if (idx >= 0) merged[idx] = item;
        else merged.unshift(item);
    }

    return merged;
}

function sanitizePeriodesList<T extends ListItem>(list: T[]): T[] {
    return list.filter((item) => {
        const p = item as { id?: string; code?: string; dateDebut?: string; dateFin?: string };
        return Boolean(p.id && p.code && p.dateDebut && p.dateFin);
    });
}

function sanitizeDevisesList<T extends ListItem>(list: T[]): T[] {
    return list.filter(
        (item) =>
            item.id &&
            !item.id.includes(":") &&
            (typeof item.name === "string" || typeof (item as { nom?: string }).nom === "string"),
    );
}

/**
 * Fusionne les créations/modifications hors ligne (cache + outbox) avec les données serveur.
 * Évite d'écraser les éléments locaux lors d'un fetch en ligne.
 */
export async function mergeListCacheWithOutbox<T extends ListItem>(
    cacheKey: string,
    incoming: T[],
): Promise<T[]> {
    const entities = entitiesForCacheKey(cacheKey);
    if (!entities.length) return incoming;

    const cached = await getCachedList<T[]>(cacheKey);
    const cachedList = cached?.data ?? [];
    const pendingOps = (await listPendingOutbox()).filter((op) =>
        entities.includes(op.entity),
    );

    const serverIds = new Set(incoming.map((item) => item.id));
    let merged = applyOutboxToList(incoming, pendingOps, cachedList);

    for (const item of cachedList) {
        if (!item._offlinePending || !item.id) continue;
        if (serverIds.has(item.id)) continue;
        if (pendingOps.some((op) => op.entityId === item.id && op.action === "DELETE")) {
            continue;
        }
        if (!merged.some((entry) => entry.id === item.id)) {
            merged = [item, ...merged];
        }
    }

    if (cacheKey === CG_CACHE_KEYS.DEVISES) {
        merged = sanitizeDevisesList(merged);
    }

    if (cacheKey === CG_CACHE_KEYS.PERIODES) {
        merged = sanitizePeriodesList(merged);
    }

    await setCachedList(cacheKey, merged);
    return merged;
}
