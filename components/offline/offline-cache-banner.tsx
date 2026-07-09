"use client";

import { useEffect, useRef } from "react";
import { CloudOff } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/** Délai avant le rappel toast (évite d'interrompre la lecture immédiate). */
const DEFAULT_REMINDER_DELAY_MS = 45_000;
const TOAST_ID = "offline-cache-reminder";

type OfflineCacheBannerProps = {
    visible: boolean;
    cachedAt?: string;
    label?: string;
    /** Délai avant affichage du toast (ms). Défaut : 45 s. */
    delayMs?: number;
};

/**
 * Rappel discret hors ligne : aucun bandeau dans la page, toast après un délai.
 */
export function OfflineCacheBanner({
    visible,
    cachedAt,
    label = "Données affichées depuis le cache local",
    delayMs = DEFAULT_REMINDER_DELAY_MS,
}: OfflineCacheBannerProps) {
    const remindedRef = useRef(false);

    useEffect(() => {
        if (!visible) {
            remindedRef.current = false;
            toast.dismiss(TOAST_ID);
            return;
        }

        const timer = window.setTimeout(() => {
            if (remindedRef.current) return;
            remindedRef.current = true;

            const description = cachedAt
                ? `Dernière synchronisation ${formatDistanceToNow(new Date(cachedAt), {
                      addSuffix: true,
                      locale: fr,
                  })}`
                : "Connexion au serveur indisponible";

            toast.warning(label, {
                id: TOAST_ID,
                description,
                icon: <CloudOff className="h-4 w-4 text-amber-600" />,
                duration: 10_000,
            });
        }, delayMs);

        return () => window.clearTimeout(timer);
    }, [visible, cachedAt, label, delayMs]);

    return null;
}
