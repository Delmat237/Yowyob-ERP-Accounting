"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getAllowedRolesForPath } from "@/hooks/use-route-access";
import { AccessDenied } from "@/components/access-denied";

/**
 * Garde de rôle du module Comptabilité.
 *
 * Complète la garde d'authentification du dashboard ({@code (dashboard)/layout.tsx},
 * qui ne vérifie que le token) : ici on vérifie le **rôle comptable**.
 *
 * - aucun rôle comptable          → écran « Accès refusé » (le backend renverrait 403
 *   sur tous les endpoints `/api/accounting/**`) ;
 * - rôle insuffisant pour la route → écran « Accès refusé » (niveau requis) ;
 * - sinon                         → page rendue normalement.
 *
 * Ferme le trou de navigation directe par URL : la sidebar masque déjà les liens
 * interdits, mais sans ce garde un accès direct chargeait la page puis échouait en
 * 403 avec un simple toast d'erreur générique.
 */
export default function AccountingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { accountingRole, initFromStorage } = useAuth();
    // On (ré)hydrate le store depuis localStorage avant de décider, pour ne pas
    // afficher un faux « Accès refusé » le temps que le store se peuple.
    const [ready, setReady] = useState(false);

    useEffect(() => {
        initFromStorage();
        setReady(true);
    }, [initFromStorage]);

    if (!ready) {
        return (
            <div className="flex min-h-[70vh] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
        );
    }

    // Sans aucun rôle comptable, le module entier est inaccessible.
    if (!accountingRole) {
        return <AccessDenied variant="no-role" />;
    }

    // Rôle présent mais insuffisant pour cette route précise.
    const allowedRoles = getAllowedRolesForPath(pathname);
    if (allowedRoles && !allowedRoles.includes(accountingRole)) {
        return (
            <AccessDenied
                variant="insufficient"
                currentRole={accountingRole}
                requiredRoles={allowedRoles}
            />
        );
    }

    return <>{children}</>;
}
