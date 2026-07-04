"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getAllowedRolesForPath } from "@/hooks/use-route-access";
import { AccessDenied } from "@/components/access-denied";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

/**
 * Garde de rôle du module Comptabilité.
 */
export default function AccountingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { accountingRole } = useAuth();
    // AuthInitializer (layout racine) hydrate déjà le store ; on attend le montage
    // client avant de décider pour éviter un faux « Accès refusé » ou des setState précoces.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <CustomPageLoader message="Chargement du module comptabilité..." />;
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
