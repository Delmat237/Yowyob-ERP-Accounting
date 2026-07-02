"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, PieChart, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isAnalytiqueRoute } from '@/config/navigation';
import { useLoadingStore } from '@/hooks/use-loading-store';
import { useAccountingSubscription } from '@/hooks/use-accounting-subscription';
import { useEffectiveAccountingChoice } from '@/hooks/use-effective-accounting-choice';
import { useAccountingChoiceModalStore } from '@/hooks/use-accounting-choice-modal-store';
import { useAccountingChoiceStore } from '@/hooks/use-accounting-choice-store';
import {
  getDashboardPathForChoice,
  GENERALE_DASHBOARD_PATH,
} from '@/lib/accounting-dashboard-routes';
import { getRedirectForWorkspaceViolation } from '@/lib/accounting-workspace-routes';
import { AccountingChoiceIllustration } from '@/components/accounting/accounting-choice-illustration';
import type { AccountingChoice } from '@/lib/accounting-choice';

type Choice = {
  key: AccountingChoice;
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
  accent: string;
};

const choices: Choice[] = [
  {
    key: 'generale',
    title: 'Comptabilité Générale',
    description: 'Plan comptable, écritures, journaux et validation des opérations.',
    href: '/accounting/dashboard',
    icon: BookOpen,
    accent: 'from-blue-600 to-indigo-600',
  },
  {
    key: 'analytique',
    title: 'Comptabilité Analytique',
    description: 'Plan analytique, centres de coût, budgets et états de gestion.',
    href: '/analytique/dashboard',
    icon: PieChart,
    accent: 'from-indigo-600 to-violet-600',
  },
];

export function AccountingChoiceModal() {
  const [open, setOpen] = useState(false);
  const mountedRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { startLoading } = useLoadingStore();
  const { generale, analytique, loaded, load } = useAccountingSubscription();
  const { choice: effectiveChoice } = useEffectiveAccountingChoice();
  const { forceOpen, clearForceOpen } = useAccountingChoiceModalStore();
  const { hydrate, setChoice } = useAccountingChoiceStore();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    load();
    hydrate();
  }, [load, hydrate]);

  const availableChoices = useMemo(
    () => choices.filter((c) => (c.key === 'generale' ? generale : analytique)),
    [generale, analytique],
  );
  const requiresExplicitChoice = availableChoices.length > 1;

  useEffect(() => {
    if (!loaded || !mountedRef.current) return;

    if (availableChoices.length === 1) {
      const only = availableChoices[0];
      setChoice(only.key);

      const onWrongModule =
        (only.key === 'analytique' && pathname === GENERALE_DASHBOARD_PATH) ||
        (only.key === 'generale' && isAnalytiqueRoute(pathname));

      if (onWrongModule) {
        router.replace(getDashboardPathForChoice(only.key));
      }
      return;
    }

    if (effectiveChoice) {
      const redirect = getRedirectForWorkspaceViolation(pathname, effectiveChoice);
      if (redirect) {
        router.replace(redirect);
      }
      return;
    }

    if (availableChoices.length > 1) {
      setOpen(true);
    }
  }, [loaded, generale, analytique, availableChoices.length, effectiveChoice, setChoice, pathname, router]);

  useEffect(() => {
    if (forceOpen && loaded && availableChoices.length > 0 && mountedRef.current) {
      setOpen(true);
      clearForceOpen();
    }
  }, [forceOpen, loaded, availableChoices.length, clearForceOpen]);

  const handleSelect = (choiceItem: Choice) => {
    setChoice(choiceItem.key);
    setOpen(false);
    startLoading();
    router.push(choiceItem.href);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && requiresExplicitChoice && !effectiveChoice) return;
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg w-full mx-4 bg-background/95 backdrop-blur-sm rounded-xl shadow-2xl border border-sky-100 z-[101] animate-in fade-in zoom-in-95 duration-500"
        overlayClassName="z-[100] bg-sky-50 animate-in fade-in duration-500 overflow-hidden"
        overlayChildren={
          <div className="absolute inset-0 pointer-events-none">
            <AccountingChoiceIllustration className="opacity-55" />
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50/30 via-transparent to-sky-100/50" />
          </div>
        }
        showCloseButton={!requiresExplicitChoice || !!effectiveChoice}
        onPointerDownOutside={(e) => {
          if (requiresExplicitChoice && !effectiveChoice) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (requiresExplicitChoice && !effectiveChoice) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Quelle comptabilité souhaitez-vous faire ?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choisissez votre espace de travail. Vous resterez dans cet espace pour toute la session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {availableChoices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              onClick={() => handleSelect(choice)}
              className="group text-left rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${choice.accent} flex items-center justify-center mb-4`}
              >
                <choice.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground flex items-center gap-1">
                {choice.title}
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{choice.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
