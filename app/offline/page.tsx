"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    getLastOfflineRoute,
    isRouteCached,
} from "@/lib/offline/route-cache-warmup";

export default function OfflinePage() {
    const [lastRoute, setLastRoute] = useState<string | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        const last = getLastOfflineRoute();
        setLastRoute(last);

        if (!last || last === "/offline") return;

        void (async () => {
            const cached = await isRouteCached(last);
            if (cached) {
                setRedirecting(true);
                window.location.replace(last);
            }
        })();
    }, []);

    if (redirecting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc] p-6">
                <p className="text-sm text-muted-foreground">Chargement de la dernière page visitée…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc] p-6">
            <div className="max-w-md w-full text-center space-y-6 bg-white rounded-xl shadow-lg p-8 border">
                <CloudOff className="h-16 w-16 text-amber-500 mx-auto" />
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Vous êtes hors ligne</h1>
                    <p className="text-sm text-muted-foreground">
                        L&apos;application n&apos;a pas pu charger cette page depuis le réseau.
                        Vos données locales et les pages déjà visitées restent disponibles.
                    </p>
                    {!lastRoute && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-md p-2">
                            Astuce : visitez une page en ligne (ex. plan comptable), attendez quelques
                            secondes, puis repassez offline. Ne videz pas le Local storage.
                        </p>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => window.location.reload()} variant="default">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Réessayer
                    </Button>
                    {lastRoute && lastRoute !== "/offline" ? (
                        <Button variant="outline" onClick={() => { window.location.href = lastRoute; }}>
                            Dernière page visitée
                        </Button>
                    ) : (
                        <Button asChild variant="outline">
                            <Link href="/">Accueil</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
