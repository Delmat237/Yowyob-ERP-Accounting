// ─── Roles ───────────────────────────────────────────────────────────────────
export type AccountingRole = "COMPTABLE" | "RESPONSABLE_COMPTABLE";

// ─── Permissions ─────────────────────────────────────────────────────────────
const permissions: Record<AccountingRole, Record<string, string[]>> = {
    COMPTABLE: {
        plan_analytique: ["read", "create", "update"],
        centres: ["read", "create", "update"],
        charges: ["read", "create", "update"],
        repartition: ["read", "create"],
        couts_complets: ["read"],
        couts_partiels: ["read"],
        imputation_rationnelle: ["read"],
        couts_pretablis: ["read"],
        concordance: ["read"],
        etats: ["read"],
        periodes: ["read"],
    },
    RESPONSABLE_COMPTABLE: {
        plan_analytique: ["read", "create", "update", "delete", "validate"],
        centres: ["read", "create", "update", "delete"],
        charges: ["read", "create", "update", "delete"],
        repartition: ["read", "create", "update", "delete", "validate"],
        couts_complets: ["read", "create"],
        couts_partiels: ["read", "create"],
        imputation_rationnelle: ["read", "create"],
        couts_pretablis: ["read", "create", "update"],
        concordance: ["read"],
        etats: ["read", "export"],
        periodes: ["read", "create", "close"],
    },
};

export function hasPermission(
    role: AccountingRole | null,
    feature: string,
    action: string
): boolean {
    if (!role) return false;
    return permissions[role]?.[feature]?.includes(action) ?? false;
}
