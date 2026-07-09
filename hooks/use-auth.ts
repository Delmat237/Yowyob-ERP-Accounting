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
 * Extrait le rôle comptable depuis le tableau de rôles du backend.
 * Le backend renvoie un tableau `roles` (string[]). On cherche en priorité
 * le rôle le plus élevé : RESPONSABLE_COMPTABLE > COMPTABLE > AIDE_COMPTABLE.
 *
 * Si aucun rôle comptable n'est trouvé, renvoie null.
 */
function extractAccountingRole(roles?: string[]): AccountingRole | null {
    if (!roles || roles.length === 0) return null;

    if (roles.includes('RESPONSABLE_COMPTABLE')) return 'RESPONSABLE_COMPTABLE';
    if (roles.includes('COMPTABLE')) return 'COMPTABLE';
    if (roles.includes('AIDE_COMPTABLE')) return 'AIDE_COMPTABLE';

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
