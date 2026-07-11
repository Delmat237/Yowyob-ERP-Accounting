"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    discardOutboxOperation,
    listConflictOutbox,
    retryOutboxOperation,
} from "@/lib/offline/outbox";
import { pullSyncChanges } from "@/lib/offline/pull-sync";
import { flushOutbox } from "@/lib/offline/sync-engine";
import type { OutboxOperation } from "@/lib/offline/types";

type ConflictDetail = {
    outboxId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    message?: string;
};

function entityLabel(entity?: string): string {
    if (!entity) return "élément";
    const labels: Record<string, string> = {
        ecriture_analytique: "écriture analytique",
        ecriture_comptable: "écriture comptable",
        "ca.centres": "centre d'analyse",
        "ca.charges": "charge analytique",
        "ca.comptes": "compte analytique",
        "ca.journaux": "journal analytique",
        "cg.journaux": "journal",
        "cg.taxes": "taxe",
        "cg.devises": "devise",
        "cg.plan_comptable": "compte",
        "cg.periodes": "période",
    };
    return labels[entity] ?? entity;
}

/**
 * Dialogue de résolution des conflits offline (HTTP 409 / updatedAt).
 * Options : garder le serveur (abandonner local) ou réessayer la mutation locale.
 */
export function SyncConflictDialog() {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<OutboxOperation | ConflictDetail | null>(null);
    const [busy, setBusy] = useState(false);

    const loadOldestConflict = useCallback(async () => {
        const conflicts = await listConflictOutbox();
        if (conflicts.length === 0) {
            setCurrent(null);
            setOpen(false);
            return;
        }
        setCurrent(conflicts[0]);
        setOpen(true);
    }, []);

    useEffect(() => {
        void loadOldestConflict();

        const onConflict = (event: Event) => {
            const detail = (event as CustomEvent<ConflictDetail>).detail;
            setCurrent((prev) => {
                if (prev) return prev;
                return {
                    id: detail.outboxId ?? "",
                    entity: detail.entity ?? "",
                    entityId: detail.entityId ?? "",
                    action: (detail.action as OutboxOperation["action"]) ?? "UPDATE",
                    payload: {},
                    clientMutationId: "",
                    createdAt: new Date().toISOString(),
                    status: "conflict",
                    retries: 0,
                    lastError: detail.message,
                };
            });
            setOpen(true);
            toast.warning("Conflit de synchronisation détecté");
        };

        window.addEventListener("sync:conflict", onConflict);
        return () => window.removeEventListener("sync:conflict", onConflict);
    }, [loadOldestConflict]);

    const outboxId =
        current && "id" in current && current.id
            ? current.id
            : (current as ConflictDetail | null)?.outboxId;

    const handleKeepServer = async () => {
        if (!outboxId || busy) return;
        setBusy(true);
        try {
            await discardOutboxOperation(outboxId);
            await pullSyncChanges().catch(() => undefined);
            toast.success("Version serveur conservée");
            await loadOldestConflict();
        } finally {
            setBusy(false);
        }
    };

    const handleRetryLocal = async () => {
        if (!outboxId || busy) return;
        setBusy(true);
        try {
            await retryOutboxOperation(outboxId);
            setOpen(false);
            setCurrent(null);
            toast.message("Nouvelle tentative de synchronisation…");
            await flushOutbox();
            await loadOldestConflict();
        } finally {
            setBusy(false);
        }
    };

    if (!current) return null;

    const entity = "entity" in current ? current.entity : undefined;
    const message =
        ("lastError" in current ? current.lastError : undefined) ||
        (current as ConflictDetail).message ||
        "La version serveur a changé pendant que vous étiez hors ligne.";

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Conflit de synchronisation</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span className="block">
                            Votre modification locale de « {entityLabel(entity)} » entre en
                            conflit avec la version serveur.
                        </span>
                        <span className="block text-xs text-muted-foreground break-words">
                            {message.replace(/^CONFLICT:\s*/i, "")}
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                    <AlertDialogCancel disabled={busy}>Plus tard</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={busy}
                        onClick={(e) => {
                            e.preventDefault();
                            void handleKeepServer();
                        }}
                    >
                        Garder le serveur
                    </AlertDialogAction>
                    <AlertDialogAction
                        disabled={busy}
                        className="bg-amber-600 hover:bg-amber-700"
                        onClick={(e) => {
                            e.preventDefault();
                            void handleRetryLocal();
                        }}
                    >
                        Réessayer le local
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
