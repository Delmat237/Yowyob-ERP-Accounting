"use client";

import { MainNav } from "./main-nav";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useNavigationStore } from "@/hooks/use-navigation-store";
import { modules, ModuleKey, SidebarLink } from "@/config/navigation";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";
import { applyAccountingModuleSwitch } from "@/lib/accounting-module-switch";
import { useEffectiveAccountingChoice } from "@/hooks/use-effective-accounting-choice";
import {
  getModuleNavigationTarget,
  isPathInModule,
  resolveDashboardSidebarLinks,
} from "@/lib/accounting-dashboard-routes";
import { useLoadingStore } from "@/hooks/use-loading-store";
import {
  isModuleVisibleForChoice,
  isWorkspaceChoiceRequired,
  resolveActiveModuleForPath,
} from "@/lib/accounting-workspace-routes";

export function Sidebar() {
  const { isCollapsed } = useSidebar();
  const { activeModule, setActiveModule } = useNavigationStore();
  const pathname = usePathname();
  const router = useRouter();
  const { startLoading } = useLoadingStore();
  const { accountingRole } = useAuth();
  const { generale, analytique, load } = useAccountingSubscription();
  const { choice: effectiveChoice } = useEffectiveAccountingChoice();
  const workspaceChoiceRequired = isWorkspaceChoiceRequired(generale, analytique);

  useEffect(() => {
    load();
  }, [load]);

  // Un module comptable est désactivé si l'organisation n'est pas abonnée
  // ou si l'autre espace comptable a été choisi après connexion.
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
      return;
    }

    if (isPathInModule(pathname, key, navOptions)) {
      setActiveModule(key);
      return;
    }

    startLoading();
    router.push(target);
  };

  useEffect(() => {
    const resolved = resolveActiveModuleForPath(pathname);
    if (resolved) {
      setActiveModule(resolved);
      return;
    }

    const currentModuleKey = Object.entries(modules).find(([, module]) =>
      module.sidebarLinks.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    )?.[0] as ModuleKey;

    if (currentModuleKey) {
      setActiveModule(currentModuleKey);
    }
  }, [pathname, setActiveModule]);

  const currentModuleData = modules[activeModule];

  // Si le module actif est désactivé (abonnement coupé), on n'affiche aucune de
  // ses options dans la barre secondaire.
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
    <aside
      className={cn(
        "h-screen bg-[#f6f8fc] flex transition-all duration-300 hidden md:flex",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="w-15 flex-shrink-0 flex flex-col items-center py-4 border-r bg-white">
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
                  <p>
                    {module.name}
                    {disabled && " — activité non abonnée"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col pt-5">
          <div className="px-4 mb-4">
            <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide px-3 mb-1">
              {currentModuleData.name}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MainNav links={filteredLinks} />
          </div>
        </div>
      )}
    </aside>
  );
}
