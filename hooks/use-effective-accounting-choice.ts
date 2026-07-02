"use client";

import { useEffect, useMemo } from 'react';
import { getAccountingChoice } from '@/lib/accounting-choice';
import {
  resolveAccountingChoiceForSubscription,
  syncStoredAccountingChoiceWithSubscription,
} from '@/lib/accounting-choice-resolver';
import { useAccountingChoiceStore } from '@/hooks/use-accounting-choice-store';
import { useAccountingSubscription } from '@/hooks/use-accounting-subscription';

/**
 * Choix d'espace comptable effectif, tenant compte du paramétrage CG
 * (Activités comptables : activation / désactivation de la CA).
 */
export function useEffectiveAccountingChoice(): {
  choice: ReturnType<typeof resolveAccountingChoiceForSubscription>;
  generale: boolean;
  analytique: boolean;
  subscriptionLoaded: boolean;
} {
  const { generale, analytique, loaded } = useAccountingSubscription();
  const storedChoice = useAccountingChoiceStore((s) => s.choice);
  const hydrate = useAccountingChoiceStore((s) => s.hydrate);
  const setChoice = useAccountingChoiceStore((s) => s.setChoice);
  const clearChoice = useAccountingChoiceStore((s) => s.clear);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!loaded) return;

    const synced = syncStoredAccountingChoiceWithSubscription(generale, analytique);
    const current = useAccountingChoiceStore.getState().choice ?? getAccountingChoice();

    if (synced !== current) {
      queueMicrotask(() => {
        if (synced) setChoice(synced);
        else clearChoice();
      });
    }
  }, [loaded, generale, analytique, setChoice, clearChoice]);

  const choice = useMemo(() => {
    if (!loaded) return null;
    const stored = storedChoice ?? getAccountingChoice();
    return resolveAccountingChoiceForSubscription(stored, generale, analytique);
  }, [loaded, storedChoice, generale, analytique]);

  return {
    choice,
    generale,
    analytique,
    subscriptionLoaded: loaded,
  };
}
