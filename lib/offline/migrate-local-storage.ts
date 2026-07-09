import type { EcritureAnalytique } from '@/lib/analytique/ecriture-analytique';
import { listEcrituresAnalytiques } from '@/lib/analytique/ecritures-analytiques-store';
import {
  ENTITY_ECRITURE_ANALYTIQUE,
  getMetaValue,
  listEntitiesByType,
  setMetaValue,
  upsertEntity,
} from '@/lib/offline/db';

const MIGRATION_KEY = 'migration.ecritures_analytiques.localStorage';

export async function migrateEcrituresAnalytiquesFromLocalStorage(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  const alreadyMigrated = await getMetaValue<boolean>(MIGRATION_KEY);
  if (alreadyMigrated) return 0;

  const legacyItems = listEcrituresAnalytiques();
  if (legacyItems.length === 0) {
    await setMetaValue(MIGRATION_KEY, true);
    return 0;
  }

  for (const item of legacyItems) {
    await upsertEntity(ENTITY_ECRITURE_ANALYTIQUE, item.id, item, 'local_only');
  }

  await setMetaValue(MIGRATION_KEY, true);
  return legacyItems.length;
}

export async function cacheEcrituresAnalytiques(items: EcritureAnalytique[]): Promise<void> {
  const { replaceEntitiesOfType } = await import('@/lib/offline/db');
  await replaceEntitiesOfType(
    ENTITY_ECRITURE_ANALYTIQUE,
    items.map((item) => ({ entityId: item.id, data: item })),
    'synced',
  );
}

export async function loadCachedEcrituresAnalytiques(): Promise<EcritureAnalytique[]> {
  return listEntitiesByType<EcritureAnalytique>(ENTITY_ECRITURE_ANALYTIQUE);
}
