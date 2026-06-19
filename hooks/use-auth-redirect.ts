"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getStoredToken, isTokenValid } from '@/lib/auth-session';

/** Chemin de la page de login (la landing héberge la modale de connexion). */
export const LOGIN_PATH = '/';
/** Page d'accueil de l'espace connecté. */
export const DASHBOARD_PATH = '/accounting/dashboard';

/**
 * `checking`    : vérification en cours (ne rien afficher pour éviter un flash).
 * `allowed`     : accès autorisé, on peut rendre la page.
 * `redirecting` : redirection déclenchée, on n'affiche rien.
 */
export type GuardStatus = 'checking' | 'allowed' | 'redirecting';

/**
 * Pages protégées (dashboard) : exige un token valide et non expiré.
 * Sinon purge la session et renvoie vers la page de login.
 *
 * La validité est re-vérifiée périodiquement, au retour de focus de l'onglet,
 * et sur changement du localStorage (logout dans un autre onglet) afin de
 * capter une expiration survenant pendant la session.
 */
export function useRequireAuth(): GuardStatus {
    const router = useRouter();
    const [status, setStatus] = useState<GuardStatus>('checking');

    useEffect(() => {
        const check = () => {
            if (isTokenValid(getStoredToken())) {
                setStatus('allowed');
            } else {
                clearSession();
                setStatus('redirecting');
                router.replace(LOGIN_PATH);
            }
        };

        check();
        const intervalId = window.setInterval(check, 30_000);
        window.addEventListener('focus', check);
        window.addEventListener('storage', check);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', check);
            window.removeEventListener('storage', check);
        };
    }, [router]);

    return status;
}

/**
 * Page de login / landing : si une session valide existe déjà,
 * on empêche l'accès à la landing et on redirige vers le dashboard.
 */
export function useRedirectIfAuthenticated(): GuardStatus {
    const router = useRouter();
    const [status, setStatus] = useState<GuardStatus>('checking');

    useEffect(() => {
        if (isTokenValid(getStoredToken())) {
            setStatus('redirecting');
            router.replace(DASHBOARD_PATH);
        } else {
            setStatus('allowed');
        }
    }, [router]);

    return status;
}
