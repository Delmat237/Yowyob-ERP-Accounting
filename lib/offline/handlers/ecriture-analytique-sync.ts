import { unwrapApiData } from "@/lib/analytique/analytique-api";
import { mapEcritureDtoToUi, mapEcritureUiToDto } from "@/lib/analytique/analytique-mappers";
import type { EcritureAnalytique } from "@/lib/analytique/ecriture-analytique";
import { buildLignesImputation } from "@/lib/analytique/ecriture-lignes";
import { cacheEntity } from "@/lib/offline/entity-cache";
import { isNetworkError, networkStatus } from "@/lib/offline/network-status";
import { ENTITY_ECRITURE_ANALYTIQUE } from "@/lib/offline/types";
import { AccountingEcrituresAnalytiquesService } from "@/src/lib2/services/AccountingEcrituresAnalytiquesService";

function isLocalEcritureId(id: string): boolean {
    return id.startsWith("ea-");
}

async function syncCreate(payload: EcritureAnalytique): Promise<void> {
    const lignes = payload.lignes?.length ? payload.lignes : buildLignesImputation(payload);
    const dto = mapEcritureUiToDto({ ...payload, lignes });
    const response = await AccountingEcrituresAnalytiquesService.createEcriture({
        ...dto,
        clientId: payload.id,
    });
    const saved = mapEcritureDtoToUi(unwrapApiData(response, "Synchronisation échouée."));
    await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, "synced");
    if (saved.id !== payload.id) {
        await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, payload.id, saved, "synced");
    }
}

/**
 * Handler de synchronisation des écritures analytiques vers l'API backend.
 */
export async function pushEcritureAnalytique(
    action: "CREATE" | "UPDATE" | "DELETE",
    payload: EcritureAnalytique,
): Promise<void> {
    try {
        if (action === "DELETE") {
            throw new Error("Suppression d'écriture analytique non disponible via l'API");
        }

        if (action === "CREATE" || (action === "UPDATE" && isLocalEcritureId(payload.id))) {
            await syncCreate(payload);
            networkStatus.reportApiSuccess();
            return;
        }

        if (action === "UPDATE" && payload.statut === "VALIDEE") {
            const response = await AccountingEcrituresAnalytiquesService.validerEcriture(payload.id);
            const saved = mapEcritureDtoToUi(unwrapApiData(response, "Validation échouée."));
            await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, "synced");
            networkStatus.reportApiSuccess();
            return;
        }

        if (action === "UPDATE" && payload.statut === "REJETEE") {
            const response = await AccountingEcrituresAnalytiquesService.rejeterEcriture(payload.id, {
                raison: payload.rejectReason ?? "Rejet hors ligne",
            });
            const saved = mapEcritureDtoToUi(unwrapApiData(response, "Rejet échoué."));
            await cacheEntity(ENTITY_ECRITURE_ANALYTIQUE, saved.id, saved, "synced");
            networkStatus.reportApiSuccess();
            return;
        }

        throw new Error("Mise à jour écriture analytique non supportée");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur de synchronisation";
        if (
            isNetworkError(err) ||
            message.includes("connexion") ||
            message.includes("Failed to fetch") ||
            message.includes("serveur")
        ) {
            networkStatus.reportApiNetworkFailure();
            throw new Error("Erreur de connexion — synchronisation en attente");
        }
        throw err instanceof Error ? err : new Error(message);
    }
}
