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
import { modules, ModuleKey, SidebarLink } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MobileSidebar() {
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const { activeModule, setActiveModule } = useNavigationStore();
  const pathname = usePathname();
  const { accountingRole } = useAuth();

  // Fermer le drawer lors d'un changement de route
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Détecter le module actif selon la route
  useEffect(() => {
    const currentModuleKey = Object.entries(modules).find(([, module]) =>
      module.sidebarLinks.some(
        (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
      )
    )?.[0] as ModuleKey;
    if (currentModuleKey) setActiveModule(currentModuleKey);
  }, [pathname, setActiveModule]);

  const currentModuleData = modules[activeModule];

  const filteredLinks: SidebarLink[] = currentModuleData.sidebarLinks.filter((link) => {
    if (!link.allowedRoles) return true;
    if (!accountingRole) return false;
    return link.allowedRoles.includes(accountingRole);
  });

  const visibleModules = Object.entries(modules).filter(([, module]) => {
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
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeModule === key ? "secondary" : "ghost"}
                      size="icon"
                      className="h-12 w-12 flex-col gap-3 text-xs"
                      onClick={() => setActiveModule(key as ModuleKey)}
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