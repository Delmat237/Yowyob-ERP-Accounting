"use client";

import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/useSidebar";
import { Menu, Bell, User, LogOut, ChevronDown, BarChart3 } from "lucide-react";

export function Header() {
    const { toggle } = useSidebar();
    const { user, accountingRole } = useAuth();

    const roleLabel = accountingRole === "RESPONSABLE_COMPTABLE"
        ? "Responsable Comptable"
        : accountingRole === "COMPTABLE"
            ? "Comptable"
            : "—";

    return (
        <header className="flex-shrink-0 h-14 flex items-center px-4 md:px-6 bg-card/70 backdrop-blur border-b border-border gap-3">
            {/* Menu toggle */}
            <button
                onClick={toggle}
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Brand */}
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-sm text-foreground tracking-tight hidden sm:block">
                    Comptabilité Analytique
                </span>
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                </button>

                {/* User widget */}
                <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary cursor-pointer transition-colors group">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-xs font-semibold text-foreground leading-none">{user?.name ?? "Utilisateur"}</p>
                        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{roleLabel}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            </div>
        </header>
    );
}
