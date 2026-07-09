/**
 * Rôles comptables du module Comptabilité.
 * Définis selon la spécification fonctionnelle (fonctionnalites_projet_de_reseau.pdf).
 *
 * - AIDE_COMPTABLE  : Accès en lecture + saisie de brouillons
 * - COMPTABLE       : Hérite de AIDE_COMPTABLE + gestion des comptes/journaux/taxes
 * - RESPONSABLE     : Accès intégral au module
 */
export const AccountingRoles = {
    AIDE_COMPTABLE: 'AIDE_COMPTABLE',
    COMPTABLE: 'COMPTABLE',
    RESPONSABLE_COMPTABLE: 'RESPONSABLE_COMPTABLE',
} as const;

export type AccountingRole = (typeof AccountingRoles)[keyof typeof AccountingRoles];

/**
 * Matrice des permissions par rôle.
 * Chaque entrée représente une fonctionnalité du module et les actions autorisées par rôle.
 *
 * Structure : permissions[feature][action] = liste des rôles autorisés
 */
export const rolePermissions: Record<string, Record<string, AccountingRole[]>> = {
    // ---------- Pièces comptables (Journal Entries) ----------
    journal_entries: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE], // UI doit brider aux brouillons pour Aide
        delete: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE], // UI restreint aux brouillons
        validate: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Plan comptable (Comptes comptables) ----------
    accounts: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        delete: [], // Aucun rôle ne peut supprimer
    },

    // ---------- Journaux comptables ----------
    journals: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        delete: [], // Aucun rôle ne peut supprimer
    },

    // ---------- Taxes ----------
    taxes: {
        read: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        delete: [], // Aucun rôle ne peut supprimer
        configure_structure: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Immobilisations ----------
    assets: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        delete: [],
        view_amortization: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        force_amortization: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        close_asset: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Budgets ----------
    budgets: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        lock: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Axes analytiques ----------
    analytics: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        impute: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Exercices / Périodes comptables ----------
    periods: {
        read: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        lock: [AccountingRoles.RESPONSABLE_COMPTABLE],
        unlock: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Paramètres comptables ----------
    accounting_settings: {
        read: [AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Devises ----------
    devises: {
        read: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.RESPONSABLE_COMPTABLE],
        delete: [],
    },

    // ---------- Packs de localisation fiscale ----------
    localization_packs: {
        read: [AccountingRoles.RESPONSABLE_COMPTABLE],
        install: [AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Gestion des utilisateurs / rôles ----------
    user_management: {
        read: [AccountingRoles.RESPONSABLE_COMPTABLE],
        assign: [AccountingRoles.RESPONSABLE_COMPTABLE],
        delete: [], // INTERDIT par principe
    },

    // ---------- Journal d'audit / actions ----------
    audit_log: {
        read: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- États financiers (lecture seule pour tous) ----------
    financial_states: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Comptabilité analytique — écritures ----------
    analytical_entries: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        validate: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        reject: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Comptabilité analytique — journaux ----------
    analytical_journals: {
        read: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Comptabilité analytique — opérations courantes (charges, coûts, plan…) ----------
    analytical_operations: {
        read: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        create: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.AIDE_COMPTABLE, AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Comptabilité analytique — périodes ----------
    analytical_periods: {
        read: [AccountingRoles.RESPONSABLE_COMPTABLE],
        close: [AccountingRoles.RESPONSABLE_COMPTABLE],
        synchronize: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Comptabilité analytique — configuration globale ----------
    analytical_config: {
        read: [AccountingRoles.RESPONSABLE_COMPTABLE],
        update: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Comptabilité analytique — budget vs réalisé ----------
    analytical_budget_vs_realise: {
        read: [AccountingRoles.COMPTABLE, AccountingRoles.RESPONSABLE_COMPTABLE],
    },

    // ---------- Comptabilité analytique — validation des budgets ----------
    analytical_budget_validation: {
        read: [AccountingRoles.RESPONSABLE_COMPTABLE],
        validate: [AccountingRoles.RESPONSABLE_COMPTABLE],
    },
};

/**
 * Vérifie si un utilisateur avec un rôle donné a le droit d'effectuer une action sur une fonctionnalité.
 *
 * @param userRole   - Rôle de l'utilisateur courant (peut être undefined/null si non connecté)
 * @param feature    - Clé de la fonctionnalité (ex: "accounts", "journals")
 * @param action     - Action souhaitée (ex: "read", "create", "update", "delete")
 * @returns          - true si l'action est autorisée, false sinon
 *
 * @example
 *   hasPermission('COMPTABLE', 'accounts', 'create') // true
 *   hasPermission('AIDE_COMPTABLE', 'taxes', 'read') // false
 */
export function hasPermission(
    userRole: string | null | undefined,
    feature: string,
    action: string,
): boolean {
    if (!userRole) return false;

    const featurePermissions = rolePermissions[feature];
    if (!featurePermissions) return false;

    const allowedRoles = featurePermissions[action];
    if (!allowedRoles) return false;

    return allowedRoles.includes(userRole as AccountingRole);
}

/**
 * Retourne le label français d'un rôle comptable.
 */
export function getRoleLabel(role: string | null | undefined): string {
    switch (role) {
        case AccountingRoles.AIDE_COMPTABLE:
            return 'Aide-comptable';
        case AccountingRoles.COMPTABLE:
            return 'Comptable';
        case AccountingRoles.RESPONSABLE_COMPTABLE:
            return 'Responsable comptable';
        default:
            return 'Inconnu';
    }
}
