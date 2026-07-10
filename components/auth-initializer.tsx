"use client";

import { useEffect } from "react";
import { clearSession, getStoredToken, isTokenValid } from "@/lib/auth-session";
import { bindOpenApiClientsFromStorage } from "@/lib/openapi-auth";
import { useAuth } from "@/hooks/use-auth";

export function AuthInitializer() {
    const { initFromStorage, clear } = useAuth();

    useEffect(() => {
        bindOpenApiClientsFromStorage();

        const token = getStoredToken();
        if (token && !isTokenValid(token)) {
            clearSession();
            clear();
            return;
        }

        initFromStorage();
    }, [initFromStorage, clear]);

    return null;
}
