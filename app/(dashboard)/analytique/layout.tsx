"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getAllowedRolesForPath } from "@/hooks/use-route-access";
import { AccessDenied } from "@/components/access-denied";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

/**
 * Garde de rôle du module Comptabilité Analytique.
 * Même logique que {@code app/(dashboard)/accounting/layout.tsx} :
 * la matrice rôle → route provient de {@code config/navigation.ts}.
 */
export default function AnalytiqueLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { accountingRole } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <CustomPageLoader message="Chargement de la comptabilité analytique..." />;
    }

    if (!accountingRole) {
        return <AccessDenied variant="no-role" />;
    }

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
