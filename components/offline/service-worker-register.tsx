"use client";

import { useEffect, useRef } from "react";

const SW_RELOAD_FLAG = "offline.sw_pending_reload";

/**
 * Enregistre le Service Worker en production pour le cache shell (Phase 4 PWA).
 */
export function ServiceWorkerRegister() {
    const reloading = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
        const enableSw =
            process.env.NODE_ENV === "production" ||
            process.env.NEXT_PUBLIC_ENABLE_OFFLINE_SW === "true";

        if (!enableSw) return;

        const onControllerChange = () => {
            if (reloading.current) return;
            if (sessionStorage.getItem(SW_RELOAD_FLAG) !== "1") return;
            reloading.current = true;
            sessionStorage.removeItem(SW_RELOAD_FLAG);
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        const register = async () => {
            try {
                const hadController = Boolean(navigator.serviceWorker.controller);

                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none",
                });

                if (registration.waiting) {
                    sessionStorage.setItem(SW_RELOAD_FLAG, "1");
                    registration.waiting.postMessage({ type: "SKIP_WAITING" });
                }

                registration.addEventListener("updatefound", () => {
                    const worker = registration.installing;
                    if (!worker) return;
                    worker.addEventListener("statechange", () => {
                        if (worker.state === "installed" && navigator.serviceWorker.controller) {
                            sessionStorage.setItem(SW_RELOAD_FLAG, "1");
                            worker.postMessage({ type: "SKIP_WAITING" });
                        }
                    });
                });

                await registration.update();

                if (!hadController && registration.active && !navigator.serviceWorker.controller) {
                    sessionStorage.setItem(SW_RELOAD_FLAG, "1");
                    registration.active.postMessage({ type: "SKIP_WAITING" });
                }
            } catch (error) {
                console.warn("[PWA] Échec enregistrement Service Worker", error);
            }
        };

        if (document.readyState === "complete") {
            void register();
        } else {
            window.addEventListener("load", register, { once: true });
        }

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
    }, []);

    return null;
}
