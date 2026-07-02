"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getAllowedRolesForPath } from "@/hooks/use-route-access";
import { AccessDenied } from "@/components/access-denied";

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
