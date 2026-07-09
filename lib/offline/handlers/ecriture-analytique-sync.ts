import type { EcritureAnalytique } from "@/lib/analytique/ecriture-analytique";
import { ENTITY_ECRITURE_ANALYTIQUE } from "@/lib/offline/types";

/**
 * Handler de synchronisation des écritures analytiques.
 * Brancher ici l'API backend quand les endpoints seront disponibles.
 */
export async function pushEcritureAnalytique(
    action: "CREATE" | "UPDATE" | "DELETE",
    payload: EcritureAnalytique,
): Promise<void> {
    // TODO: remplacer par AccountingAnalyticEntriesService quand l'API existera.
    // Exemple attendu :
    // if (action === "CREATE") await AccountingAnalyticEntriesService.create(payload);
    // if (action === "UPDATE") await AccountingAnalyticEntriesService.update(payload.id, payload);
    // if (action === "DELETE") await AccountingAnalyticEntriesService.delete(payload.id);

    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.info(`[offline-sync] ${action} ${ENTITY_ECRITURE_ANALYTIQUE}`, payload.id);
    }

    // Pas d'API backend CA pour l'instant : l'opération reste en attente côté outbox
    // jusqu'à ce que le handler appelle réellement le serveur.
    throw new Error("API écritures analytiques non disponible — synchronisation en attente backend");
}
