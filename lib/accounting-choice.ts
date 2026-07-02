import type { ModuleKey } from '@/config/navigation';

/** Espace comptable choisi par l'utilisateur après connexion. */
export type AccountingChoice = Extract<ModuleKey, 'generale' | 'analytique'>;

export const ACCOUNTING_CHOICE_KEY = 'ksm.accountingChoice';

/** Ancienne clé booléenne — purgée à la connexion / déconnexion. */
export const ACCOUNTING_CHOICE_LEGACY_KEY = 'ksm.accountingChoiceMade';

export function getAccountingChoice(): AccountingChoice | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(ACCOUNTING_CHOICE_KEY);
  if (value === 'generale' || value === 'analytique') return value;
  return null;
}

export function setAccountingChoice(choice: AccountingChoice): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ACCOUNTING_CHOICE_KEY, choice);
  sessionStorage.removeItem(ACCOUNTING_CHOICE_LEGACY_KEY);
}

export function clearAccountingChoice(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ACCOUNTING_CHOICE_KEY);
  sessionStorage.removeItem(ACCOUNTING_CHOICE_LEGACY_KEY);
}

export function hasAnalytiqueAccess(): boolean {
  return getAccountingChoice() === 'analytique';
}

export function hasGeneraleAccess(): boolean {
  return getAccountingChoice() === 'generale';
}
