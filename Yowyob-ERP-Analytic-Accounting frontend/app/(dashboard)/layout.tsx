"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    return (
        <div className="h-screen w-screen overflow-hidden flex bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main
                    className={cn(
                        "flex-1 overflow-y-auto p-4 md:p-6 pt-4",
                        "bg-gradient-to-br from-background via-background to-muted/30"
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
