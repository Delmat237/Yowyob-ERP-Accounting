"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "@/hooks/use-loading-store";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

export const NavigationLoader = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isLoading, stopLoading } = useLoadingStore();

    useEffect(() => {
        // `pathname`/`searchParams` change as soon as the new route is *committed*
        // (the client page component mounts), which for client-fetched pages happens
        // BEFORE its data is loaded and painted — stopping here hides the loader too
        // early, leaving a blank screen. Defer to after the browser has actually
        // painted the new route's first frame (double rAF) so the overlay hands off
        // to the page's own content/skeleton without a visible gap.
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => stopLoading());
        });
        return () => {
            cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
        };
    }, [pathname, searchParams, stopLoading]);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
            <CustomPageLoader message="Chargement en cours..." />
        </div>
    );
};
