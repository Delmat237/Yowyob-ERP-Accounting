"use client";

import { useEffect } from "react";
import { MainNav } from "./main-nav";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useNavigationStore } from "@/hooks/use-navigation-store";
import { modules, ModuleKey } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";

export function Sidebar() {
    const { isCollapsed } = useSidebar();
    const { activeModule, setActiveModule } = useNavigationStore();
    const pathname = usePathname();
    const { accountingRole, initFromStorage } = useAuth();

    useEffect(() => {
        initFromStorage();
    }, [initFromStorage]);

    useEffect(() => {
        const found = Object.entries(modules).find(([, mod]) =>
            mod.sidebarLinks.some(
                (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
            )
        );
        if (found) setActiveModule(found[0] as ModuleKey);
    }, [pathname, setActiveModule]);

    const currentModule = modules[activeModule];

    const filteredLinks = currentModule.sidebarLinks.filter((link) => {
        if (!link.allowedRoles) return true;
        if (!accountingRole) return false;
        return link.allowedRoles.includes(accountingRole);
    });

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar flex transition-all duration-300 border-r border-sidebar-border shadow-sm",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* ── Module icon strip ── */}
            <div className="w-16 flex-shrink-0 flex flex-col items-center py-6 border-r border-sidebar-border bg-card/50">
                <div className="flex flex-col gap-2">
                    {Object.entries(modules).map(([key, mod]) => {
                        const Icon = mod.icon;
                        const isActive = activeModule === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveModule(key as ModuleKey)}
                                title={mod.name}
                                className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Module links panel ── */}
            {!isCollapsed && (
                <div className="flex-1 flex flex-col pt-5 overflow-hidden bg-gradient-to-b from-sidebar to-background">
                    {/* Module header */}
                    <div className="px-4 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                <currentModule.icon className="h-4 w-4 text-primary" />
                            </div>
                            <h2 className="text-sm font-bold text-foreground tracking-tight">
                                {currentModule.name}
                            </h2>
                        </div>
                        <div className="h-0.5 w-10 bg-gradient-to-r from-primary to-transparent rounded-full opacity-50" />
                    </div>

                    {/* Links */}
                    <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
                        <MainNav links={filteredLinks} />
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-4 border-t border-sidebar-border">
                        <div className="text-[10px] text-muted-foreground text-center font-medium">
                            Comptabilité Analytique
                        </div>
                        <div className="text-[9px] text-muted-foreground/60 text-center">
                            Yowyob ERP v1.0
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
