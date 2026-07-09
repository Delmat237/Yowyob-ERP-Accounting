/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BudgetVsRealiseDto = {
    exerciceId?: string;
    exerciceCode?: string;
    lignes?: Array<{
        noCompte?: string;
        libelleCompte?: string;
        montantBudget?: number;
        montantRealise?: number;
        ecart?: number;
        tauxRealisation?: number;
    }>;
    totalBudget?: number;
    totalRealise?: number;
    totalEcart?: number;
    tauxRealisation?: number;
};
