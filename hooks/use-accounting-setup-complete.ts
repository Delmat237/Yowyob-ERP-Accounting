'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountingSetupService } from '@/src/lib2/services/AccountingSetupService';
import {
  isAccountingSetupComplete,
  readCachedAccountingSetupComplete,
  writeCachedAccountingSetupComplete,
} from '@/lib/accounting-setup-complete';
import { CG_WORKSPACE_ENTERED_EVENT } from '@/lib/accounting-workspace-memory';
import { useEffectiveAccountingChoice } from '@/hooks/use-effective-accounting-choice';

function readOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('organization_id');
}

export function useAccountingSetupComplete(enabled = true) {
  const { choice, generale } = useEffectiveAccountingChoice();
  const orgId = readOrganizationId();
  const active = enabled && generale && (choice === null || choice === 'generale');

  const [isComplete, setIsComplete] = useState<boolean | null>(() => {
    if (!active) return null;
    return readCachedAccountingSetupComplete(orgId) ? true : null;
  });

  const refresh = useCallback(async () => {
    if (!active) {
      setIsComplete(null);
      return;
    }

    const cached = readCachedAccountingSetupComplete(readOrganizationId());
    if (cached) setIsComplete(true);

    try {
      const year = new Date().getFullYear();
      const response = await AccountingSetupService.getStatus(year);
      const complete = isAccountingSetupComplete(response?.data?.steps);
      writeCachedAccountingSetupComplete(complete, readOrganizationId());
      setIsComplete(complete);
    } catch {
      if (!cached) setIsComplete(false);
    }
  }, [active]);

  useEffect(() => {
    void refresh();
  }, [refresh, choice, generale]);

  useEffect(() => {
    if (!active) return;
    const onCgEntered = () => {
      void refresh();
    };
    window.addEventListener(CG_WORKSPACE_ENTERED_EVENT, onCgEntered);
    return () => window.removeEventListener(CG_WORKSPACE_ENTERED_EVENT, onCgEntered);
  }, [active, refresh]);

  return { isComplete, isLoading: active && isComplete === null, refresh };
}
