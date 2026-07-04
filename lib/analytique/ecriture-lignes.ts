import type { EcritureAnalytique } from "@/lib/analytique/ecriture-analytique";

export interface LigneImputationAnalytique {
    centreId: string;
    natureChargeId: string;
    montant: number;
    libelle?: string;
}

/** Génère les lignes d'imputation (+ / −) selon la présence d'un centre source. */
export function buildLignesImputation(
    entry: Pick<
        EcritureAnalytique,
        "centreSourceId" | "centreDestinationId" | "natureChargeId" | "montant" | "libelleOperation"
    >,
): LigneImputationAnalytique[] {
    if (entry.centreSourceId && entry.montant > 0) {
        return [
            {
                centreId: entry.centreSourceId,
                natureChargeId: entry.natureChargeId,
                montant: -entry.montant,
                libelle: `${entry.libelleOperation} (sortie)`,
            },
            {
                centreId: entry.centreDestinationId,
                natureChargeId: entry.natureChargeId,
                montant: entry.montant,
                libelle: `${entry.libelleOperation} (entrée)`,
            },
        ];
    }

    return [
        {
            centreId: entry.centreDestinationId,
            natureChargeId: entry.natureChargeId,
            montant: entry.montant,
            libelle: entry.libelleOperation,
        },
    ];
}

export function formatMontantSigne(montant: number, currency = "XAF"): string {
    const sign = montant >= 0 ? "+" : "−";
    return `${sign}${Math.abs(montant).toLocaleString("fr-FR")} ${currency}`;
}
