"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAnalytiqueRoute } from '@/config/navigation';
import { useAccountingSubscription } from '@/hooks/use-accounting-subscription';
import { useAccountingChoiceModalStore } from '@/hooks/use-accounting-choice-modal-store';
import { useEffectiveAccountingChoice } from '@/hooks/use-effective-accounting-choice';
import {
  ANALYTIQUE_DASHBOARD_PATH,
  GENERALE_DASHBOARD_PATH,
} from '@/lib/accounting-dashboard-routes';
import {
  getRedirectForWorkspaceViolation,
  isAnalytiqueBridgedAccountingRoute,
  isGeneraleAccountingRoute,
  isWorkspaceChoiceRequired,
} from '@/lib/accounting-workspace-routes';

/**
 * Isole les espaces CG et CA : redirection si l'utilisateur accède au mauvais module
 * après avoir choisi son espace comptable.
 */
export function useAccountingAccessGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { generale, analytique, loaded, load } = useAccountingSubscription();
  const { choice: effectiveChoice } = useEffectiveAccountingChoice();
  const requestOpen = useAccountingChoiceModalStore((s) => s.requestOpen);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loaded) return;

    if (!analytique && (isAnalytiqueRoute(pathname) || isAnalytiqueBridgedAccountingRoute(pathname))) {
      router.replace(GENERALE_DASHBOARD_PATH);
      return;
    }

    if (!generale && analytique && pathname === GENERALE_DASHBOARD_PATH) {
      router.replace(ANALYTIQUE_DASHBOARD_PATH);
      return;
    }

    if (isWorkspaceChoiceRequired(generale, analytique) && effectiveChoice === null) {
      const touchesAccountingSpace =
        isGeneraleAccountingRoute(pathname) ||
        isAnalytiqueRoute(pathname) ||
        isAnalytiqueBridgedAccountingRoute(pathname);

      if (touchesAccountingSpace) {
        requestOpen();
      }
      return;
    }

    if (effectiveChoice) {
      const redirect = getRedirectForWorkspaceViolation(pathname, effectiveChoice);
      if (redirect) {
        router.replace(redirect);
        return;
      }
    }

    if (!isAnalytiqueRoute(pathname) && !isAnalytiqueBridgedAccountingRoute(pathname)) {
      return;
    }

    if (!analytique) {
      router.replace(GENERALE_DASHBOARD_PATH);
      return;
    }

    if (!generale) return;

    if (effectiveChoice === null) {
      requestOpen();
      return;
    }

    if (effectiveChoice !== 'analytique') {
      router.replace(GENERALE_DASHBOARD_PATH);
      requestOpen();
    }
  }, [pathname, loaded, analytique, generale, effectiveChoice, router, requestOpen]);
}
