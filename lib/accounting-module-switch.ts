import type { ModuleKey } from '@/config/navigation';
import { useAccountingChoiceStore } from '@/hooks/use-accounting-choice-store';
import { rememberWorkspaceModule } from '@/lib/accounting-workspace-memory';

const ACCOUNTING_MODULES = ['generale', 'analytique'] as const;
export type AccountingChoice = (typeof ACCOUNTING_MODULES)[number];

export function isAccountingModule(key: ModuleKey): key is AccountingChoice {
  return ACCOUNTING_MODULES.includes(key as AccountingChoice);
}

/** Enregistre le choix d'espace lors d'un basculement via la sidebar. */
export function applyAccountingModuleSwitch(key: ModuleKey): void {
  if (isAccountingModule(key)) {
    useAccountingChoiceStore.getState().setChoice(key);
    return;
  }
  const choice = useAccountingChoiceStore.getState().choice;
  if (choice === 'generale' || choice === 'analytique') {
    rememberWorkspaceModule(choice, key);
  }
}
