"use client";

import { useRouter, usePathname } from "next/navigation";
import { BookOpen, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";
import { useEffectiveAccountingChoice } from "@/hooks/use-effective-accounting-choice";
import { useAccountingChoiceStore } from "@/hooks/use-accounting-choice-store";
import { useLoadingStore } from "@/hooks/use-loading-store";
import { getDashboardPathForChoice } from "@/lib/accounting-dashboard-routes";
import { applyAccountingModuleSwitch } from "@/lib/accounting-module-switch";
import { isAnalytiqueRoute } from "@/config/navigation";
import { isAnalytiqueBridgedAccountingRoute } from "@/lib/accounting-workspace-routes";
import type { AccountingChoice } from "@/lib/accounting-choice";

const WORKSPACE_META: Record<
  AccountingChoice,
  { label: string; icon: typeof BookOpen }
> = {
  generale: {
    label: "Comptabilité Générale",
    icon: BookOpen,
  },
  analytique: {
    label: "Comptabilité Analytique",
    icon: GitBranch,
  },
};

function resolveCurrentWorkspace(
  choice: AccountingChoice | null,
  pathname: string,
): AccountingChoice {
  if (choice) return choice;
  if (isAnalytiqueRoute(pathname) || isAnalytiqueBridgedAccountingRoute(pathname)) {
    return "analytique";
  }
  return "generale";
}

export function AccountingWorkspaceSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const { generale, analytique, loaded } = useAccountingSubscription();
  const { choice } = useEffectiveAccountingChoice();
  const setChoice = useAccountingChoiceStore((s) => s.setChoice);
  const { startLoading } = useLoadingStore();

  if (!loaded || !generale || !analytique) {
    return null;
  }

  const current = resolveCurrentWorkspace(choice, pathname);
  const target: AccountingChoice = current === "analytique" ? "generale" : "analytique";
  const meta = WORKSPACE_META[target];
  const Icon = meta.icon;

  const handleSwitch = () => {
    setChoice(target);
    applyAccountingModuleSwitch(target);
    startLoading();
    router.push(getDashboardPathForChoice(target));
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSwitch}
          className="h-9 gap-1.5 px-2 sm:px-3 text-gray-700 hover:text-blue-800 hover:bg-blue-50/80"
          aria-label={`Basculer vers ${meta.label}`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-xs sm:text-sm font-medium leading-tight max-w-[7rem] sm:max-w-none text-center sm:text-left">
            {meta.label}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Basculer vers {meta.label}
      </TooltipContent>
    </Tooltip>
  );
}
