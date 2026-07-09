import type { AccountingChoice } from '@/lib/accounting-choice';
import type { ModuleKey } from '@/config/navigation';

const LAST_CG_MODULE_KEY = 'yowyob.workspace.lastCgModule';
const LAST_CA_MODULE_KEY = 'yowyob.workspace.lastCaModule';

const CG_DEFAULT_MODULE: ModuleKey = 'clients';
const CA_DEFAULT_MODULE: ModuleKey = 'analytique';

const CG_MODULE_KEYS = new Set<ModuleKey>([
  'dashboard',
  'generale',
  'configuration',
  'analyse',
  'clients',
  'fournisseurs',
]);

const CA_MODULE_KEYS = new Set<ModuleKey>([
  'analytique',
  'analyseAnalytique',
  'configurationAnalytique',
]);

function storageKey(choice: AccountingChoice): string {
  return choice === 'generale' ? LAST_CG_MODULE_KEY : LAST_CA_MODULE_KEY;
}

function isModuleForChoice(choice: AccountingChoice, module: ModuleKey): boolean {
  return choice === 'generale' ? CG_MODULE_KEYS.has(module) : CA_MODULE_KEYS.has(module);
}

/** Mémorise le dernier module latéral consulté dans l'espace CG ou CA. */
export function rememberWorkspaceModule(choice: AccountingChoice, module: ModuleKey): void {
  if (typeof window === 'undefined') return;
  if (!isModuleForChoice(choice, module)) return;
  localStorage.setItem(storageKey(choice), module);
}

/** Restaure le module latéral mémorisé pour l'espace demandé. */
export function getRememberedWorkspaceModule(choice: AccountingChoice): ModuleKey {
  if (typeof window === 'undefined') {
    return choice === 'generale' ? CG_DEFAULT_MODULE : CA_DEFAULT_MODULE;
  }
  const raw = localStorage.getItem(storageKey(choice)) as ModuleKey | null;
  if (raw && isModuleForChoice(choice, raw)) return raw;
  return choice === 'generale' ? CG_DEFAULT_MODULE : CA_DEFAULT_MODULE;
}

export const CG_WORKSPACE_ENTERED_EVENT = 'yowyob:cg-workspace-entered';

export function notifyCgWorkspaceEntered(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CG_WORKSPACE_ENTERED_EVENT));
}
