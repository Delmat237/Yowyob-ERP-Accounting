"use client";

import { modules } from "@/config/navigation";
import {
    ANALYTIQUE_ALL_ROLES,
    ANALYTIQUE_ROUTE_ROLE_OVERRIDES,
} from "@/lib/analytique-route-access";

/**
 * Résout les rôles autorisés pour un chemin donné à partir de la configuration
 * de navigation ({@code config/navigation.ts}) — la même source de vérité que
 * la sidebar. On évite ainsi de dupliquer la matrice rôle→route.
 *
 * Règles :
 *  - on retient le(s) lien(s) dont le `href` correspond le mieux au chemin
 *    (égalité, ou préfixe `href/...` ; le plus long `href` gagne) ;
 *  - si un de ces liens n'a pas de `allowedRoles`, la route est considérée
 *    sans restriction (renvoie `null`) ;
 *  - sinon on renvoie l'union des `allowedRoles` (le plus permissif), la
 *    décision fine restant appliquée côté backend (@PreAuthorize).
 *
 * @returns la liste des rôles autorisés, ou `null` si la route n'est pas restreinte.
 */
export function getAllowedRolesForPath(pathname: string): string[] | null {
    let bestLen = -1;
    const matches: { href: string; allowedRoles?: string[] }[] = [];

    for (const moduleKey of Object.keys(modules) as (keyof typeof modules)[]) {
        for (const link of modules[moduleKey].sidebarLinks) {
            const href = link.href;
            const isMatch = pathname === href || pathname.startsWith(`${href}/`);
            if (!isMatch) continue;

            if (href.length > bestLen) {
                bestLen = href.length;
                matches.length = 0;
                matches.push(link);
            } else if (href.length === bestLen) {
                matches.push(link);
            }
        }
    }

    if (matches.length === 0) {
        for (const [path, roles] of Object.entries(ANALYTIQUE_ROUTE_ROLE_OVERRIDES)) {
            if (pathname === path || pathname.startsWith(`${path}/`)) {
                return [...roles];
            }
        }
        if (pathname === "/analytique" || pathname.startsWith("/analytique/")) {
            return [...ANALYTIQUE_ALL_ROLES];
        }
        return null;
    }

    // Une seule correspondance sans restriction => route libre.
    const roles = new Set<string>();
    for (const m of matches) {
        if (!m.allowedRoles) return null;
        m.allowedRoles.forEach((r) => roles.add(r));
    }
    return Array.from(roles);
}
