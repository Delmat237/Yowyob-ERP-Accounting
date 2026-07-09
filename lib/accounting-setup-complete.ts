import type { AccountingSetupStepResult } from '@/src/lib2/services/AccountingSetupService';

export const ACCOUNTING_SETUP_PATH = '/accounting/setup';

export const ACCOUNTING_SETUP_COMPLETE_CACHE_KEY = 'yowyob.cg.setup.complete';

export function setupCompleteCacheKey(organizationId?: string | null): string {
  if (!organizationId) return ACCOUNTING_SETUP_COMPLETE_CACHE_KEY;
  return `${ACCOUNTING_SETUP_COMPLETE_CACHE_KEY}.${organizationId}`;
}

export function readCachedAccountingSetupComplete(organizationId?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(setupCompleteCacheKey(organizationId)) === '1';
}

export function writeCachedAccountingSetupComplete(
  complete: boolean,
  organizationId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  const key = setupCompleteCacheKey(organizationId);
  if (complete) localStorage.setItem(key, '1');
  else localStorage.removeItem(key);
}

export const ACCOUNTING_SETUP_COMPONENT_KEYS = [
  'planComptable',
  'journaux',
  'exercice',
  'periodes',
  'operations',
] as const;

/** Vrai lorsque tous les composants d'initialisation sont déjà en place ou créés. */
export function isAccountingSetupComplete(
  steps: AccountingSetupStepResult[] | undefined,
): boolean {
  if (!steps?.length) return false;

  return ACCOUNTING_SETUP_COMPONENT_KEYS.every((key) => {
    const status = steps.find((step) => step.key === key)?.status;
    return status === 'ALREADY_PRESENT' || status === 'CREATED';
  });
}
