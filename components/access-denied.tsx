"use client";

import { ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRoleLabel } from "@/src/lib/auth/roles";

interface AccessDeniedProps {
    /**
     * `no-role`      : l'utilisateur n'a aucun rôle comptable reconnu.
     * `insufficient` : il a un rôle, mais pas le niveau requis pour cette page.
     */
    variant?: "no-role" | "insufficient";
    /** Rôle comptable courant (affiché pour aider au diagnostic). */
    currentRole?: string | null;
    /** Rôles qui auraient donné accès (variante `insufficient`). */
    requiredRoles?: string[];
}

/**
 * Écran d'accès refusé pour le module Comptabilité.
 *
 * Affiché par le garde de rôle ({@code app/(dashboard)/accounting/layout.tsx})
 * lorsqu'un utilisateur connecté ne possède pas le rôle comptable nécessaire,
 * au lieu de laisser la page émettre des appels API qui échouent en 403 et
 * de n'afficher qu'un toast d'erreur générique.
 */
export function AccessDenied({ variant = "no-role", currentRole, requiredRoles }: AccessDeniedProps) {
    const router = useRouter();

    return (
        <div className="flex min-h-[70vh] w-full items-center justify-center p-4">
            <Card className="max-w-md border-red-100">
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <ShieldX className="h-7 w-7 text-red-500" />
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900">Accès refusé</h2>

                    {variant === "no-role" ? (
                        <p className="text-sm text-gray-600">
                            Votre compte ne possède aucun rôle comptable. Vous ne pouvez pas
                            accéder au module Comptabilité tant qu'un rôle
                            (<span className="font-medium">Aide-comptable</span>,{" "}
                            <span className="font-medium">Comptable</span> ou{" "}
                            <span className="font-medium">Responsable comptable</span>) ne vous a
                            pas été attribué.
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Cette page nécessite un niveau d'accès supérieur. Votre rôle actuel
                            {currentRole ? (
                                <> (<span className="font-medium">{getRoleLabel(currentRole)}</span>)</>
                            ) : null}{" "}
                            ne permet pas de la consulter.
                            {requiredRoles && requiredRoles.length > 0 && (
                                <>
                                    {" "}
                                    Rôles requis :{" "}
                                    <span className="font-medium">
                                        {requiredRoles.map(getRoleLabel).join(", ")}
                                    </span>
                                    .
                                </>
                            )}
                        </p>
                    )}

                    <p className="text-xs text-gray-400">
                        Contactez votre responsable comptable pour obtenir les droits nécessaires.
                    </p>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                            Retour
                        </Button>
                        <Button size="sm" onClick={() => router.push("/accounting/dashboard")}>
                            Tableau de bord
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
