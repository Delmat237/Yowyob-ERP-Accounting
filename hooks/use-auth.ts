import { create } from 'zustand/react';
import { hasPermission, AccountingRole } from '@/src/lib/auth/roles';
import { User } from '@/src/lib/models/User';

interface AuthState {
    /** Utilisateur connecté (chargé depuis localStorage) */
    user: User | null;
    /** Rôle comptable actif de l'utilisateur */
    accountingRole: AccountingRole | null;
    /** Indique si l'utilisateur est authentifié */
    isAuthenticated: boolean;

    /** Initialise l'état depuis localStorage */
    initFromStorage: () => void;
    /** Met à jour l'utilisateur et son rôle comptable */
    setUser: (user: User | null) => void;
    /** Retourne true si l'utilisateur a le droit d'effectuer l'action */
    checkPermission: (feature: string, action: string) => boolean;
    /** Vide la session (logout) */
    clear: () => void;
}

/**
 * Rôles « super-utilisateur » : propriétaire / administrateur d'organisation /
 * administrateur transverse. Alignés sur le backend (OWNER = ADMIN, cf.
 * {@code AccountingAuthorities}) : ils obtiennent l'accès comptable intégral
 * sans qu'on leur assigne un rôle comptable dédié.
 */
const SUPER_ROLES = ['ADMIN', 'OWNER', 'ORGANIZATION_ADMIN'];

/** Normalise une autorité : retire le préfixe `ROLE_` et le suffixe de scope `#TENANT`/`#ORGANIZATION:...`. */
function normalizeRole(role: string): string {
    return role.replace(/^ROLE_/, '').split('#')[0].trim().toUpperCase();
}

/**
 * Extrait le rôle comptable depuis le tableau de rôles du backend.
 * Le backend renvoie un tableau `roles` (string[]) mêlant noms de rôle nus,
 * formes préfixées `ROLE_...` et scopées `...#ORGANIZATION:<id>`. On normalise
 * avant comparaison. Priorité : super-utilisateur (OWNER/ADMIN) puis
 * RESPONSABLE_COMPTABLE > COMPTABLE > AIDE_COMPTABLE.
 *
 * Un OWNER/ADMIN est mappé sur RESPONSABLE_COMPTABLE (accès intégral) pour que
 * `hasPermission`, la garde de route et les menus l'autorisent partout.
 *
 * Si aucun rôle exploitable n'est trouvé, renvoie null.
 */
function extractAccountingRole(roles?: string[]): AccountingRole | null {
    if (!roles || roles.length === 0) return null;

    const normalized = roles.map(normalizeRole);

    if (normalized.some((r) => SUPER_ROLES.includes(r))) return 'RESPONSABLE_COMPTABLE';
    if (normalized.includes('RESPONSABLE_COMPTABLE')) return 'RESPONSABLE_COMPTABLE';
    if (normalized.includes('COMPTABLE')) return 'COMPTABLE';
    if (normalized.includes('AIDE_COMPTABLE')) return 'AIDE_COMPTABLE';

    return null;
}

export const useAuth = create<AuthState>((set, get) => ({
    user: null,
    accountingRole: null,
    isAuthenticated: false,

    initFromStorage: () => {
        try {
            const raw = localStorage.getItem('user');
            if (raw) {
                const user: User = JSON.parse(raw);
                const accountingRole = extractAccountingRole(user.roles);
                set({ user, accountingRole, isAuthenticated: true });
            }
        } catch {
            // Ignore les erreurs de parsing (token corrompu, etc.)
        }
    },

    setUser: (user: User | null) => {
        if (user) {
            const accountingRole = extractAccountingRole(user.roles);
            set({ user, accountingRole, isAuthenticated: true });
        } else {
            set({ user: null, accountingRole: null, isAuthenticated: false });
        }
    },

    checkPermission: (feature: string, action: string) => {
        const { accountingRole } = get();
        return hasPermission(accountingRole, feature, action);
    },

    clear: () => {
        set({ user: null, accountingRole: null, isAuthenticated: false });
    },
}));
