import type { OutboxOperation } from "@/lib/offline/types";

/**
 * Données CA mock : déjà persistées dans IndexedDB via upsertInCachedList.
 * Le handler sync ne fait qu'accuser réception (pas d'API backend CA).
 */
export async function pushCaMockList(_op: OutboxOperation): Promise<void> {
    // Rien à pousser côté serveur pour l'instant.
}
