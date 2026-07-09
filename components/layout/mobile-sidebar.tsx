"use client";

import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MainNav } from "./main-nav";
import { useSidebar } from "@/hooks/useSidebar";
import { useNavigationStore } from "@/hooks/use-navigation-store";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";
import { modules, ModuleKey, SidebarLink } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { applyAccountingModuleSwitch } from "@/lib/accounting-module-switch";
import { useEffectiveAccountingChoice } from "@/hooks/use-effective-accounting-choice";
import { resolveDashboardSidebarLinks, isDashboardPath } from "@/lib/accounting-dashboard-routes";
import {
  filterSidebarLinksForWorkspace,
  isAccountingModuleDisabled,
  isModuleVisibleForChoice,
  resolveActiveModuleForPath,
} from "@/lib/accounting-workspace-routes";
import { ACCOUNTING_SETUP_PATH } from "@/lib/accounting-setup-complete";
import { useAccountingSetupComplete } from "@/hooks/use-accounting-setup-complete";
import {
  getRememberedWorkspaceModule,
  rememberWorkspaceModule,
} from "@/lib/accounting-workspace-memory";
import Link from "next/link";
import { YowyobLogo } from "@/components/brand/yowyob-logo";
import { getDefaultDashboardPath } from "@/lib/accounting-dashboard-routes";

export function MobileSidebar() {
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const { activeModule, setActiveModule } = useNavigationStore();
  const pathname = usePathname();
  const { accountingRole } = useAuth();
  const { generale, analytique, load } = useAccountingSubscription();
  const { choice: effectiveChoice } = useEffectiveAccountingChoice();
  const { isComplete: isSetupComplete } = useAccountingSetupComplete(
    accountingRole === "RESPONSABLE_COMPTABLE" && generale,
  );

  useEffect(() => {
    load();
  }, [load]);

  const isModuleDisabled = (key: ModuleKey): boolean =>
    isAccountingModuleDisabled(key, { generale, analytique, effectiveChoice });

  const handleModuleSwitch = (key: ModuleKey) => {
    if (isModuleDisabled(key)) return;
    applyAccountingModuleSwitch(key);
    setActiveModule(key);
  };

  useEffect(() => {
    if (effectiveChoice === "generale" || effectiveChoice === "analytique") {
      rememberWorkspaceModule(effectiveChoice, activeModule);
    }
  }, [effectiveChoice, activeModule]);

  useEffect(() => {
    if (effectiveChoice !== "generale") return;
    const caModules: ModuleKey[] = [
      "analytique",
      "analyseAnalytique",
      "configurationAnalytique",
    ];
    if (caModules.includes(activeModule)) {
      setActiveModule(getRememberedWorkspaceModule("generale"));
    }
  }, [effectiveChoice, activeModule, setActiveModule]);

  // Fermer le drawer lors d'un changement de route
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Détecter le module actif selon la route
  useEffect(() => {
    const resolved = resolveActiveModuleForPath(pathname);
    if (resolved) {
      setActiveModule(resolved);
      return;
    }

    const currentModuleKey = Object.entries(modules).find(([key, module]) => {
      if (key === "dashboard") return false;
      return module.sidebarLinks.some(
        (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
      );
    })?.[0] as ModuleKey;
    if (currentModuleKey) setActiveModule(currentModuleKey);
  }, [pathname, setActiveModule]);

  const currentModuleData = modules[activeModule];

  const filteredLinks: SidebarLink[] = isModuleDisabled(activeModule)
    ? []
    : filterSidebarLinksForWorkspace(
        activeModule,
        (activeModule === "dashboard"
          ? resolveDashboardSidebarLinks({ generale, analytique, choice: effectiveChoice })
          : currentModuleData.sidebarLinks.filter((link) => !isDashboardPath(link.href))
        ).filter((link) => {
          if (link.href === ACCOUNTING_SETUP_PATH && isSetupComplete) return false;
          if (!link.allowedRoles) return true;
          if (!accountingRole) return false;
          return link.allowedRoles.includes(accountingRole);
        }),
        effectiveChoice,
        generale,
        analytique,
      );

  const visibleModules = Object.entries(modules).filter(([key, module]) => {
    if (!isModuleVisibleForChoice(key, effectiveChoice, generale, analytique)) {
      return false;
    }
    if (!module.allowedRoles) return true;
    if (!accountingRole) return false;
    return module.allowedRoles.includes(accountingRole);
  });

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="p-0 w-[300px] flex flex-row">
        {/* Colonne icônes modules — identique à la sidebar desktop */}
        <div className="w-16 flex-shrink-0 flex flex-col items-center py-4 border-r bg-white">
          <Link
            href={getDefaultDashboardPath({
              generale,
              analytique,
              choice: effectiveChoice,
            })}
            className="mb-4 flex shrink-0 items-center justify-center"
            aria-label="Yowyob ERP — accueil"
            onClick={() => setMobileOpen(false)}
          >
            <YowyobLogo size="sm" />
          </Link>
          <TooltipProvider delayDuration={0}>
            {visibleModules.map(([key, module]) => {
              const Icon = module.icon;
              const disabled = isModuleDisabled(key as ModuleKey);
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeModule === key ? "secondary" : "ghost"}
                      size="icon"
                      disabled={disabled}
                      aria-disabled={disabled}
                      className={cn(
                        "h-12 w-12 flex-col gap-3 text-xs",
                        disabled && "opacity-40 cursor-not-allowed"
                      )}
                      onClick={() => handleModuleSwitch(key as ModuleKey)}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{module.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Colonne navigation — identique au panneau droit de la sidebar desktop */}
        <div className="flex-1 flex flex-col bg-[#f6f8fc] pt-5 overflow-y-auto">
          <div className="px-4 mb-4">
            <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide px-3 mb-1">
              {currentModuleData.name}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MainNav links={filteredLinks} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}