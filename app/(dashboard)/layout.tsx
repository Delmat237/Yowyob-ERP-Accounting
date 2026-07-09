"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ComposeWindow } from "@/components/ui/compose-window";
import { AccountingChoiceModal } from "@/components/accounting/accounting-choice-modal";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { useAccountingAccessGuard } from "@/hooks/use-accounting-access-guard";
import { canShowDashboardRouteContent } from "@/lib/accounting-workspace-routes";
import { useEffectiveAccountingChoice } from "@/hooks/use-effective-accounting-choice";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { OfflineProvider } from "@/components/offline/offline-provider";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const authStatus = useRequireAuth();
  const { choice, generale, analytique, subscriptionLoaded } = useEffectiveAccountingChoice();
  const loadSubscription = useAccountingSubscription((s) => s.load);
  useAccountingAccessGuard();

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  if (authStatus === "redirecting") {
    return <CustomPageLoader message="Redirection vers la connexion..." />;
  }

  if (authStatus !== "allowed") {
    return <CustomPageLoader message="Vérification de la session..." />;
  }

  const showContent = canShowDashboardRouteContent(pathname, {
    subscriptionLoaded,
    generale,
    analytique,
    choice,
  });

  if (!subscriptionLoaded) {
    return <CustomPageLoader message="Chargement de l'espace..." />;
  }

  if (!showContent) {
    // Le contenu est masqué tant qu'un choix d'espace (CG/CA) est requis mais non fait.
    // On monte la modale de choix ici sans loader bloquant par-dessus.
    return <AccountingChoiceModal />;
  }

  return (
    <OfflineProvider>
    <div className="h-screen w-screen overflow-hidden flex bg-[#f6f8fc]">
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pt-2">{children}</main>
      </div>
      <ComposeWindow />
      <AccountingChoiceModal />
    </div>
    </OfflineProvider>
  );
}
