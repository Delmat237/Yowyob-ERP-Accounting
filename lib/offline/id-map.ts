import { idbGet, idbPut } from "@/lib/offline/idb";
import type { MetaEntry } from "@/lib/offline/types";

const ID_MAP_PREFIX = "id-map.";

export async function setIdMapping(clientId: string, serverId: string): Promise<void> {
    await idbPut("meta", { key: `${ID_MAP_PREFIX}${clientId}`, value: serverId } satisfies MetaEntry);
}

export async function getIdMapping(clientId: string): Promise<string | undefined> {
    const entry = await idbGet<MetaEntry>("meta", `${ID_MAP_PREFIX}${clientId}`);
    return typeof entry?.value === "string" ? entry.value : undefined;
}

/** Résout un identifiant client offline vers l'identifiant serveur si mappé. */
export async function resolveServerId(id: string): Promise<string> {
    const mapped = await getIdMapping(id);
    if (mapped) return mapped;
    return id;
}

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True si l'id n'est pas un UUID serveur (créé hors ligne). */
export function isOfflineClientId(id?: string | null): boolean {
    if (!id) return false;
    return !UUID_RE.test(id);
}

export function newOfflineEcritureId(): string {
    return `ec-offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
