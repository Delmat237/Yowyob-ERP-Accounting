"use client";

import { MainNav } from "./main-nav";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useNavigationStore } from "@/hooks/use-navigation-store";
import { modules, ModuleKey, SidebarLink } from "@/config/navigation";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";
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

export function Sidebar() {
  const { isCollapsed, setCollapsed } = useSidebar();
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
    if (isCollapsed) {
      setCollapsed(false);
    }
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

    if (currentModuleKey) {
      setActiveModule(currentModuleKey);
    }
  }, [pathname, setActiveModule]);

  const currentModuleData = modules[activeModule];

  // Si le module actif est désactivé (abonnement coupé), on n'affiche aucune de
  // ses options dans la barre secondaire.
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
    <aside
      className={cn(
        "h-screen bg-[#f6f8fc] flex transition-all duration-300 hidden md:flex",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="w-15 flex-shrink-0 flex flex-col items-center py-4 border-r bg-white">
        <Link
          href={getDefaultDashboardPath({
            generale,
            analytique,
            choice: effectiveChoice,
          })}
          className="mb-4 flex shrink-0 items-center justify-center"
          aria-label="Yowyob ERP — accueil"
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
