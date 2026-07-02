"use client";

import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MainNav } from "./main-nav";
import { useSidebar } from "@/hooks/useSidebar";
import { useNavigationStore } from "@/hooks/use-navigation-store";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";
import { modules, ModuleKey, SidebarLink } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { applyAccountingModuleSwitch } from "@/lib/accounting-module-switch";
import { useEffectiveAccountingChoice } from "@/hooks/use-effective-accounting-choice";
import {
  getModuleNavigationTarget,
  isPathInModule,
  resolveDashboardSidebarLinks,
} from "@/lib/accounting-dashboard-routes";
import {
  isModuleVisibleForChoice,
  isWorkspaceChoiceRequired,
  resolveActiveModuleForPath,
} from "@/lib/accounting-workspace-routes";

export function MobileSidebar() {
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const { activeModule, setActiveModule } = useNavigationStore();
  const pathname = usePathname();
  const router = useRouter();
  const { accountingRole } = useAuth();
  const { generale, analytique, load } = useAccountingSubscription();
  const { choice: effectiveChoice } = useEffectiveAccountingChoice();

  useEffect(() => {
    load();
  }, [load]);
  const workspaceChoiceRequired = isWorkspaceChoiceRequired(generale, analytique);

  const isModuleDisabled = (key: ModuleKey): boolean => {
    if (key === "generale") {
      return !generale || (workspaceChoiceRequired && effectiveChoice === "analytique");
    }
    if (key === "analytique") {
      return !analytique || (workspaceChoiceRequired && effectiveChoice === "generale");
    }
    if (key === "configuration") {
      return !generale || (workspaceChoiceRequired && effectiveChoice === "analytique");
    }
    if (key === "configurationAnalytique") {
      return !analytique || (workspaceChoiceRequired && effectiveChoice === "generale");
    }
    if (key === "analyse") {
      return !generale || (workspaceChoiceRequired && effectiveChoice === "analytique");
    }
    if (key === "clients" || key === "fournisseurs") {
      return !generale || (workspaceChoiceRequired && effectiveChoice === "analytique");
    }
    if (key === "analyseAnalytique") {
      return !analytique || (workspaceChoiceRequired && effectiveChoice === "generale");
    }
    return false;
  };

  const navOptions = {
    choice: effectiveChoice,
    generale,
    analytique,
    accountingRole,
  };

  const handleModuleSwitch = (key: ModuleKey) => {
    if (isModuleDisabled(key)) return;
    applyAccountingModuleSwitch(key);

    const target = getModuleNavigationTarget(key, navOptions);
    if (!target) {
      setActiveModule(key);
      setMobileOpen(false);
      return;
    }

    if (isPathInModule(pathname, key, navOptions)) {
      setActiveModule(key);
      setMobileOpen(false);
      return;
    }

    router.push(target);
    setMobileOpen(false);
  };

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

    const currentModuleKey = Object.entries(modules).find(([, module]) =>
      module.sidebarLinks.some(
        (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
      )
    )?.[0] as ModuleKey;
    if (currentModuleKey) setActiveModule(currentModuleKey);
  }, [pathname, setActiveModule]);

  const currentModuleData = modules[activeModule];

  const filteredLinks: SidebarLink[] = isModuleDisabled(activeModule)
    ? []
    : (activeModule === "dashboard"
        ? resolveDashboardSidebarLinks({ generale, analytique, choice: effectiveChoice })
        : currentModuleData.sidebarLinks
      ).filter((link) => {
        if (activeModule === "analytique" && effectiveChoice !== "analytique") return false;
        if (activeModule === "analyseAnalytique" && effectiveChoice !== "analytique") return false;
        if (activeModule === "analyse" && effectiveChoice === "analytique") return false;
        if (activeModule === "configurationAnalytique" && effectiveChoice !== "analytique") {
          return false;
        }
        if (
          (activeModule === "generale" ||
            activeModule === "configuration" ||
            activeModule === "analyse" ||
            activeModule === "clients" ||
            activeModule === "fournisseurs") &&
          effectiveChoice === "analytique"
        ) {
          return false;
        }
        if (!link.allowedRoles) return true;
        if (!accountingRole) return false;
        return link.allowedRoles.includes(accountingRole);
      });

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