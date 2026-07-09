import type { ModuleKey, SidebarLink } from '@/config/navigation';
import { modules, isAnalytiqueRoute } from '@/config/navigation';
import type { AccountingChoice } from '@/lib/accounting-choice';
import { resolveSidebarWorkspaceChoice } from '@/lib/accounting-choice-resolver';
import { networkStatus } from '@/lib/offline/network-status';
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

/** Hors ligne (détection réseau). */
export function isOfflineFreeWorkspaceNavigation(): boolean {
  return !networkStatus.isOnline();
}

export { resolveSidebarWorkspaceChoice } from '@/lib/accounting-choice-resolver';

function isCgModuleVisible(
  moduleKey: string,
  workspaceChoice: AccountingChoice | null,
  generale: boolean,
): boolean {
  if (!generale) return false;
  if (workspaceChoice === 'analytique') return false;
  return (
    moduleKey === 'generale' ||
    moduleKey === 'configuration' ||
    moduleKey === 'analyse' ||
    moduleKey === 'clients' ||
    moduleKey === 'fournisseurs'
  );
}

function isCaModuleVisible(
  moduleKey: string,
  workspaceChoice: AccountingChoice | null,
  analytique: boolean,
): boolean {
  if (!analytique) return false;
  if (workspaceChoice === 'generale') return false;
  return (
    moduleKey === 'analytique' ||
    moduleKey === 'analyseAnalytique' ||
    moduleKey === 'configurationAnalytique'
  );
}

/** Module latéral grisé (abonnement ou espace en ligne uniquement). */
export function isAccountingModuleDisabled(
  key: ModuleKey,
  options: {
    generale: boolean;
    analytique: boolean;
    effectiveChoice: AccountingChoice | null;
  },
): boolean {
  const { generale, analytique, effectiveChoice } = options;
  const workspaceChoiceRequired = isWorkspaceChoiceRequired(generale, analytique);
  const resolvedChoice = resolveSidebarWorkspaceChoice(effectiveChoice, generale, analytique);

  if (key === 'generale') {
    return !generale || (workspaceChoiceRequired && resolvedChoice === 'analytique');
  }
  if (key === 'analytique') {
    return !analytique || (workspaceChoiceRequired && resolvedChoice === 'generale');
  }
  if (key === 'configuration') {
    return !generale || (workspaceChoiceRequired && resolvedChoice === 'analytique');
  }
  if (key === 'configurationAnalytique') {
    return !analytique || (workspaceChoiceRequired && resolvedChoice === 'generale');
  }
  if (key === 'analyse') {
    return !generale || (workspaceChoiceRequired && resolvedChoice === 'analytique');
  }
  if (key === 'clients' || key === 'fournisseurs') {
    return !generale || (workspaceChoiceRequired && resolvedChoice === 'analytique');
  }
  if (key === 'analyseAnalytique') {
    return !analytique || (workspaceChoiceRequired && resolvedChoice === 'generale');
  }

  return false;
}

/** Filtre les liens secondaires selon l'espace comptable (CG / CA). */
export function filterSidebarLinksForWorkspace(
  activeModule: ModuleKey,
  links: SidebarLink[],
  effectiveChoice: AccountingChoice | null,
  generale = true,
  analytique = true,
): SidebarLink[] {
  const workspaceChoice = resolveSidebarWorkspaceChoice(effectiveChoice, generale, analytique);

  return links.filter((link) => {
    if (activeModule === 'analytique' && workspaceChoice !== 'analytique') return false;
    if (activeModule === 'analyseAnalytique' && workspaceChoice !== 'analytique') return false;
    if (activeModule === 'analyse' && workspaceChoice === 'analytique') return false;
    if (activeModule === 'configurationAnalytique' && workspaceChoice !== 'analytique') {
      return false;
    }
    if (
      (activeModule === 'generale' ||
        activeModule === 'configuration' ||
        activeModule === 'analyse' ||
        activeModule === 'clients' ||
        activeModule === 'fournisseurs') &&
      workspaceChoice === 'analytique'
    ) {
      return false;
    }
    return true;
  });
}

/** Module latéral visible selon l'espace comptable choisi. */
export function isModuleVisibleForChoice(
  moduleKey: string,
  choice: AccountingChoice | null,
  generale: boolean,
  analytique: boolean,
): boolean {
  // Même hors ligne : ne pas afficher les modules de l'autre espace dans la sidebar.
  if (isOfflineFreeWorkspaceNavigation()) {
    const workspaceChoice = resolveSidebarWorkspaceChoice(choice, generale, analytique);
    if (workspaceChoice === 'analytique') {
      if (
        moduleKey === 'analytique' ||
        moduleKey === 'analyseAnalytique' ||
        moduleKey === 'configurationAnalytique' ||
        moduleKey === 'dashboard'
      ) {
        return analytique;
      }
      return false;
    }

    // Par défaut (CG)
    if (
      moduleKey === 'generale' ||
      moduleKey === 'configuration' ||
      moduleKey === 'analyse' ||
      moduleKey === 'clients' ||
      moduleKey === 'fournisseurs' ||
      moduleKey === 'dashboard'
    ) {
      return generale;
    }
    return false;
  }

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

  const workspaceChoice = resolveSidebarWorkspaceChoice(choice, generale, analytique);
  const requiresChoice = isWorkspaceChoiceRequired(generale, analytique);

  if (requiresChoice && choice === null && networkStatus.isOnline()) {
    return false;
  }

  if (pathname === GENERALE_DASHBOARD_PATH || pathname.startsWith(`${GENERALE_DASHBOARD_PATH}/`)) {
    if (!generale) return false;
    return !requiresChoice || workspaceChoice === 'generale';
  }
  if (pathname === ANALYTIQUE_DASHBOARD_PATH || pathname.startsWith(`${ANALYTIQUE_DASHBOARD_PATH}/`)) {
    if (!analytique) return false;
    return !requiresChoice || workspaceChoice === 'analytique';
  }

  if (isAnalytiqueRoute(pathname) || isAnalytiqueBridgedAccountingRoute(pathname)) {
    if (!analytique) return false;
    return !requiresChoice || workspaceChoice === 'analytique';
  }

  if (isGeneraleAccountingRoute(pathname)) {
    if (!generale) return false;
    return !requiresChoice || workspaceChoice === 'generale';
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
