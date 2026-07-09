"use client";

import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";

type Props = {
    periode: PeriodeComptableDto | null;
    loading?: boolean;
    onRefresh?: () => void;
};

export function PeriodeComptableVisibleSelector({ periode, loading, onRefresh }: Props) {
    if (loading) {
        return (
            <div className="h-10 w-72 rounded-md bg-muted/40 animate-pulse" />
        );
    }

    if (!periode) {
        return (
            <p className="text-sm text-muted-foreground">Aucune période comptable disponible.</p>
        );
    }

    const debut = new Date(periode.dateDebut).toLocaleDateString("fr-FR");
    const fin = new Date(periode.dateFin).toLocaleDateString("fr-FR");

    return (
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/30 text-sm min-w-[18rem]">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{periode.code}</span>
                <span className="text-muted-foreground text-xs">({debut} – {fin})</span>
            </div>
            {onRefresh && (
                <Button variant="ghost" size="icon" onClick={onRefresh} title="Rafraîchir la période">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
