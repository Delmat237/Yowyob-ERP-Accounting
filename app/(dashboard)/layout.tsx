"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import React, { useEffect } from "react";
import { ComposeWindow } from "@/components/ui/compose-window";
import { useLoadingStore } from "@/hooks/use-loading-store";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth-redirect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { stopLoading } = useLoadingStore();
  const pathname = usePathname();
  // Garde d'authentification : sans token valide (ou token expiré), la session
  // est purgée et l'utilisateur est renvoyé sur la page de login.
  const authStatus = useRequireAuth();

  useEffect(() => {
    // When the layout mounts or route changes, stop the global loader
    stopLoading();
  }, [pathname, stopLoading]);

  // Tant que la vérification n'a pas confirmé l'accès, on n'affiche pas le
  // dashboard (évite tout flash de contenu protégé avant la redirection).
  if (authStatus !== "allowed") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f6f8fc]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

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