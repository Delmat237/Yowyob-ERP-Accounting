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

export function Sidebar() {
  const { isCollapsed } = useSidebar();
  const { activeModule, setActiveModule } = useNavigationStore();
  const pathname = usePathname();
  const { accountingRole } = useAuth();

  useEffect(() => {
    const currentModuleKey = Object.entries(modules).find(([key, module]) =>
      module.sidebarLinks.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    )?.[0] as ModuleKey;

    if (currentModuleKey) {
      setActiveModule(currentModuleKey);
    }
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
