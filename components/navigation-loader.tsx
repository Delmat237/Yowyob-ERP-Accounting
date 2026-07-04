"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "@/hooks/use-loading-store";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { scheduleNavigationLoadingStop } from "@/lib/navigation-loading";

export const NavigationLoader = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isLoading, stopLoading } = useLoadingStore();

    useEffect(() => {
        if (!useLoadingStore.getState().isLoading) return undefined;
        return scheduleNavigationLoadingStop(stopLoading);
    }, [pathname, searchParams, stopLoading]);

    if (!isLoading) return null;

    return <CustomPageLoader message="Chargement en cours..." />;
};
