"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useModuleSidebar } from "@/hooks/useModuleSidebar";
import { useNavigationStore } from "@/hooks/use-navigation-store";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";
import { modules } from "@/config/navigation";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { YowyobLogo } from "@/components/brand/yowyob-logo";

export function ModuleSidebar() {
  const { isCollapsed, toggle } = useModuleSidebar();
  const { activeModule, setActiveModule } = useNavigationStore();
  const { generale, analytique, load } = useAccountingSubscription();

  // Charge l'abonnement de l'organisation courante une fois au montage.
  useEffect(() => {
    load();
  }, [load]);

  // N'affiche que les modules comptables auxquels l'organisation est abonnée.
  const visibleModules = Object.entries(modules).filter(([key]) => {
    if (key === "generale") return generale;
    if (key === "analytique") return analytique;
    return true;
  });

  return (
    <aside
      className={cn(
        "h-screen bg-white flex flex-col border-r transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="h-16 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={toggle} className="h-12 w-12">
          <Menu className="h-5 w-5 text-gray-600" />
        </Button>
        {!isCollapsed && (
          <YowyobLogo size="sm" />
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-center py-4 gap-2">
        <TooltipProvider delayDuration={0}>
          {visibleModules.map(([key, module]) => {
            const Icon = module.icon;
            const isActive = activeModule === key;
            return isCollapsed ? (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="icon"
                    className="h-14 w-14"
                    onClick={() => setActiveModule(key as any)}
                  >
                    <Icon className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>{module.name}</p></TooltipContent>
              </Tooltip>
            ) : (
              <Button
                key={key}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-[90%] h-12 justify-start px-4 text-base",
                  isActive && "font-bold"
                )}
                onClick={() => setActiveModule(key as any)}
              >
                <Icon className="mr-4 h-6 w-6" />
                {module.name}
              </Button>
            );
          })}
        </TooltipProvider>
      </div>
    </aside>
  );
}