"use client";

import { useEffect, useSyncExternalStore } from 'react';
import { clearSession, getStoredToken, isTokenValid } from '@/lib/auth-session';
import { networkStatus } from '@/lib/offline/network-status';

/** Chemin de la page de login (la landing héberge la modale de connexion). */
export const LOGIN_PATH = '/';
/** Page d'accueil par défaut (CG) — préférer getDefaultDashboardPath avec l'abonnement. */
export const DASHBOARD_PATH = '/accounting/dashboard';

/**
 * `checking`    : vérification en cours.
 * `allowed`     : accès autorisé, on peut rendre la page.
 * `redirecting` : redirection vers la page de connexion.
 */
export type GuardStatus = 'checking' | 'allowed' | 'redirecting';

function hasLocalSessionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(getStoredToken() || localStorage.getItem('user'));
}

function evaluateAuthStatus(): GuardStatus {
  if (typeof window === 'undefined') return 'checking';

  const token = getStoredToken();
  if (isTokenValid(token)) return 'allowed';

  // Offline-first : session locale suffit (JWT expiré accepté tant qu'un snapshot existe).
  if (hasLocalSessionSnapshot()) return 'allowed';

  return 'redirecting';
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === LOGIN_PATH) return;
  clearSession();
  window.location.assign(LOGIN_PATH);
}

function subscribeAuthStatus(onStoreChange: () => void): () => void {
  const intervalId = window.setInterval(onStoreChange, 30_000);
  const onFocus = () => onStoreChange();
  const onStorage = () => onStoreChange();
  window.addEventListener('focus', onFocus);
  window.addEventListener('storage', onStorage);
  const unsubNetwork = networkStatus.subscribe(() => onStoreChange());
  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('storage', onStorage);
    unsubNetwork();
  };
}

/**
 * Pages protégées (dashboard) : exige un token valide et non expiré.
 * Sinon purge la session et renvoie vers la page de connexion.
 */
export function useRequireAuth(): GuardStatus {
  const status = useSyncExternalStore(
    subscribeAuthStatus,
    evaluateAuthStatus,
    () => 'checking' as GuardStatus,
  );

  useEffect(() => {
    if (status === 'redirecting') {
      redirectToLogin();
    }
  }, [status]);

  return status;
}

/**
 * Page de login / landing : si une session valide existe déjà,
 * on empêche l'accès à la landing et on redirige vers le dashboard.
 */
export function useRedirectIfAuthenticated(): GuardStatus {
  const status = useSyncExternalStore(
    subscribeAuthStatus,
    () => (isTokenValid(getStoredToken()) ? 'redirecting' : 'allowed') as GuardStatus,
    () => 'checking' as GuardStatus,
  );

  useEffect(() => {
    if (status === 'redirecting') {
      window.location.assign(DASHBOARD_PATH);
    }
  }, [status]);

  return status;
}
