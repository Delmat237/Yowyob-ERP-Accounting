import { idbGet, idbPut } from "@/lib/offline/idb";
import type { MetaEntry } from "@/lib/offline/types";
import { isOfflineClientId, newOfflineEcritureId } from "@/lib/offline/ids";

export { isOfflineClientId, newOfflineEcritureId };

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
