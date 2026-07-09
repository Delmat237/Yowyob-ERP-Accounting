import { idbGet, idbPut } from "@/lib/offline/idb";
import type { MetaEntry } from "@/lib/offline/types";

const MIGRATION_KEY = "migration.localStorage.ecritures_analytiques";

export async function isMigrationDone(key: string): Promise<boolean> {
    const entry = await idbGet<MetaEntry>("meta", key);
    return entry?.value === true;
}

export async function markMigrationDone(key: string): Promise<void> {
    await idbPut("meta", { key, value: true } satisfies MetaEntry);
}

export { MIGRATION_KEY };
