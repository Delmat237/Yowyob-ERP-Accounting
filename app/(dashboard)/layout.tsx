"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import React, { useEffect } from "react";
import { ComposeWindow } from "@/components/ui/compose-window";
import { useLoadingStore } from "@/hooks/use-loading-store";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { stopLoading } = useLoadingStore();
  const pathname = usePathname();

  useEffect(() => {
    // When the layout mounts or route changes, stop the global loader
    stopLoading();
  }, [pathname, stopLoading]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f6f8fc]">
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pt-2">
          {children}
        </main>
      </div>
      <ComposeWindow />
    </div>
  );
}