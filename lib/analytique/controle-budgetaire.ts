/** Seuil d'alerte budgétaire par défaut (%). */
export const SEUIL_ALERTE_BUDGET_DEFAUT = 80;

export interface ControleBudgetResult {
    alerte: boolean;
    depassement: boolean;
    tauxApres: number;
    budgetAlloue: number;
    consommeActuel: number;
    consommeApres: number;
    seuil: number;
    message: string;
}

/** Budgets simulés centre × compte × exercice (en attendant l'API). */
const MOCK_BUDGETS: Array<{
    centreId: string;
    natureChargeId: string;
    exerciceId: string;
    montantBudget: number;
    montantConsomme: number;
    seuilAlerte: number;
}> = [
    {
        centreId: "c1",
        natureChargeId: "605100",
        exerciceId: "cg-ex-2026",
        montantBudget: 800_000,
        montantConsomme: 650_000,
        seuilAlerte: 80,
    },
    {
        centreId: "c1",
        natureChargeId: "601000",
        exerciceId: "cg-ex-2026",
        montantBudget: 3_000_000,
        montantConsomme: 2_500_000,
        seuilAlerte: 80,
    },
    {
        centreId: "c3",
        natureChargeId: "605100",
        exerciceId: "cg-ex-2026",
        montantBudget: 500_000,
        montantConsomme: 320_000,
        seuilAlerte: 80,
    },
];

export function controlerBudgetEcriture(params: {
    centreDestinationId: string;
    natureChargeId: string;
    exerciceAnalytiqueId: string;
    montantAjoute: number;
    centreDestinationLibelle?: string;
    exerciceLibelle?: string;
    natureChargeLibelle?: string;
}): ControleBudgetResult | null {
    const budget = MOCK_BUDGETS.find(
        (b) =>
            b.centreId === params.centreDestinationId &&
            b.natureChargeId === params.natureChargeId &&
            b.exerciceId === params.exerciceAnalytiqueId,
    );

    if (!budget || params.montantAjoute <= 0) return null;

    const consommeApres = budget.montantConsomme + params.montantAjoute;
    const tauxApres =
        budget.montantBudget > 0 ? (consommeApres / budget.montantBudget) * 100 : 0;
    const depassement = consommeApres > budget.montantBudget;
    const alerte = tauxApres >= budget.seuilAlerte;

    const centreLabel = params.centreDestinationLibelle ?? "centre destination";
    const exerciceLabel = params.exerciceLibelle ?? "exercice";
    const compteLabel = params.natureChargeLibelle
        ? `${params.natureChargeId} (${params.natureChargeLibelle})`
        : params.natureChargeId;

    let message = `${centreLabel} — compte ${compteLabel}, ${exerciceLabel} : consommation après saisie ${tauxApres.toFixed(1)} % du budget (${consommeApres.toLocaleString("fr-FR")} / ${budget.montantBudget.toLocaleString("fr-FR")} XAF).`;

    if (depassement) {
        message = `Dépassement budgétaire — ${message}`;
    } else if (alerte) {
        message = `Seuil d'alerte (${budget.seuilAlerte} %) franchi — ${message}`;
    }

    return {
        alerte: alerte || depassement,
        depassement,
        tauxApres,
        budgetAlloue: budget.montantBudget,
        consommeActuel: budget.montantConsomme,
        consommeApres,
        seuil: budget.seuilAlerte,
        message,
    };
}
