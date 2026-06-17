import { OpenAPI as CoreOpenAPI } from '@/src/lib';
import { OpenAPI as AccountingOpenAPI } from '@/src/lib2';

/** Clés de session purgées au logout / à l'expiration. */
const SESSION_KEYS = ['auth_token', 'user', 'organization_id', 'tenant_id'];

/** Lit le token courant (null hors navigateur). */
export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
}

/** Décode l'epoch d'expiration (en secondes) d'un JWT, ou null si illisible. */
function getJwtExp(token: string): number | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(json);
        return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
        return null;
    }
}

/**
 * Vrai si le token existe et n'est pas expiré.
 * - Token mock dev (`mock-…`) : pas d'expiration → toujours valide.
 * - JWT : valide tant que `exp` est dans le futur (marge 10 s pour l'horloge).
 * - JWT sans `exp` décodable / illisible : considéré invalide (par sécurité).
 */
export function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    if (token.startsWith('mock-')) return true;
    const exp = getJwtExp(token);
    if (exp === null) return false;
    return Date.now() < exp * 1000 - 10_000;
}

/** True si une session valide est présente côté navigateur. */
export function isAuthenticated(): boolean {
    return isTokenValid(getStoredToken());
}

/** Purge la session : localStorage + tokens OpenAPI des deux clients. */
export function clearSession(): void {
    if (typeof window !== 'undefined') {
        SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
    }
    CoreOpenAPI.TOKEN = undefined;
    AccountingOpenAPI.TOKEN = undefined;
}
