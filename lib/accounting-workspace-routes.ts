import type { ModuleKey } from '@/config/navigation';
import { modules, isAnalytiqueRoute } from '@/config/navigation';
import type { AccountingChoice } from '@/lib/accounting-choice';
import {
  ANALYTIQUE_DASHBOARD_PATH,
  GENERALE_DASHBOARD_PATH,
  isDashboardPath,
} from '@/lib/accounting-dashboard-routes';

/** Routes CG sous /accounting encore accessibles depuis l'espace analytique (API). */
export const ANALYTIQUE_BRIDGE_ACCOUNTING_PREFIXES = [
  '/accounting/analytics',
  '/accounting/budgets',
  '/accounting/budget-validation',
] as const;

export function isAnalytiqueBridgedAccountingRoute(pathname: string): boolean {
  return ANALYTIQUE_BRIDGE_ACCOUNTING_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getGeneraleWorkspaceHrefs(): string[] {
  const hrefs = new Set<string>([GENERALE_DASHBOARD_PATH]);
  for (const key of ['generale', 'configuration', 'analyse', 'clients', 'fournisseurs'] as ModuleKey[]) {
    for (const link of modules[key].sidebarLinks) {
      hrefs.add(link.href);
    }
  }
  return [...hrefs];
}

/** Route réservée à l'espace comptabilité générale (modules CG + configuration). */
export function isGeneraleAccountingRoute(pathname: string): boolean {
  if (isAnalytiqueBridgedAccountingRoute(pathname)) return false;
  return getGeneraleWorkspaceHrefs().some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

export function isWorkspaceChoiceRequired(
  generale: boolean,
  analytique: boolean,
): boolean {
  return generale && analytique;
}

/** Module latéral visible selon l'espace comptable choisi. */
export function isModuleVisibleForChoice(
  moduleKey: string,
  choice: AccountingChoice | null,
  generale: boolean,
  analytique: boolean,
): boolean {
  const requiresChoice = isWorkspaceChoiceRequired(generale, analytique);

  if (requiresChoice && choice === null) {
    if (
      moduleKey === 'generale' ||
      moduleKey === 'analytique' ||
      moduleKey === 'analyse' ||
      moduleKey === 'analyseAnalytique' ||
      moduleKey === 'clients' ||
      moduleKey === 'fournisseurs' ||
      moduleKey === 'configuration' ||
      moduleKey === 'configurationAnalytique'
    ) {
      return false;
    }
  }

  if (requiresChoice && choice === 'analytique') {
    if (
      moduleKey === 'generale' ||
      moduleKey === 'configuration' ||
      moduleKey === 'analyse' ||
      moduleKey === 'clients' ||
      moduleKey === 'fournisseurs'
    ) {
      return false;
    }
  }

  if (requiresChoice && choice === 'generale') {
    if (
      moduleKey === 'analytique' ||
      moduleKey === 'analyseAnalytique' ||
      moduleKey === 'configurationAnalytique'
    ) {
      return false;
    }
  }

  if (moduleKey === 'generale') return generale;
  if (moduleKey === 'analytique') return analytique;
  if (moduleKey === 'analyse') return generale;
  if (moduleKey === 'analyseAnalytique') return analytique;
  if (moduleKey === 'clients') return generale;
  if (moduleKey === 'fournisseurs') return generale;
  if (moduleKey === 'configuration') return generale;
  if (moduleKey === 'configurationAnalytique') return analytique;

  return true;
}

/** Contenu affichable dans le layout dashboard. */
export function canShowDashboardRouteContent(
  pathname: string,
  options: {
    subscriptionLoaded: boolean;
    generale: boolean;
    analytique: boolean;
    choice: AccountingChoice | null;
  },
): boolean {
  const { subscriptionLoaded, generale, analytique, choice } = options;
  if (!subscriptionLoaded) return false;

  const requiresChoice = isWorkspaceChoiceRequired(generale, analytique);
  if (requiresChoice && choice === null) {
    return false;
  }

  if (isAnalytiqueRoute(pathname) || isAnalytiqueBridgedAccountingRoute(pathname)) {
    if (!analytique) return false;
    if (requiresChoice && choice !== 'analytique') return false;
    return true;
  }

  if (isGeneraleAccountingRoute(pathname)) {
    if (!generale) return false;
    if (requiresChoice && choice === 'analytique') return false;
    return true;
  }

  return true;
}

export function getRedirectForWorkspaceViolation(
  pathname: string,
  choice: AccountingChoice,
): string | null {
  if (choice === 'analytique' && isGeneraleAccountingRoute(pathname)) {
    return ANALYTIQUE_DASHBOARD_PATH;
  }
  if (
    choice === 'generale' &&
    (isAnalytiqueRoute(pathname) || isAnalytiqueBridgedAccountingRoute(pathname))
  ) {
    return GENERALE_DASHBOARD_PATH;
  }
  return null;
}

/** Module latéral actif selon la route (correspondance la plus spécifique). */
export function resolveActiveModuleForPath(pathname: string): ModuleKey | null {
  if (isDashboardPath(pathname)) {
    return 'dashboard';
  }

  let bestKey: ModuleKey | null = null;
  let bestLen = -1;

  for (const key of Object.keys(modules) as ModuleKey[]) {
    if (key === 'dashboard') continue;
    for (const link of modules[key].sidebarLinks) {
      const { href } = link;
      const matches = pathname === href || pathname.startsWith(`${href}/`);
      if (matches && href.length > bestLen) {
        bestLen = href.length;
        bestKey = key;
      }
    }
  }

  return bestKey;
}
