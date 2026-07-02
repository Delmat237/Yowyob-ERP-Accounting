import { LayoutDashboard } from 'lucide-react';
import { modules, type ModuleKey } from '@/config/navigation';
import type { SidebarLink } from '@/config/navigation';
import type { AccountingChoice } from '@/lib/accounting-choice';

export const GENERALE_DASHBOARD_PATH = '/accounting/dashboard';
export const ANALYTIQUE_DASHBOARD_PATH = '/analytique/dashboard';

export function getDashboardPathForChoice(choice: AccountingChoice): string {
  return choice === 'analytique' ? ANALYTIQUE_DASHBOARD_PATH : GENERALE_DASHBOARD_PATH;
}

/** Route d'accueil après connexion selon l'abonnement et le choix d'espace. */
export function getDefaultDashboardPath(options: {
  generale: boolean;
  analytique: boolean;
  choice: AccountingChoice | null;
}): string {
  const { generale, analytique, choice } = options;
  if (choice) return getDashboardPathForChoice(choice);
  if (analytique && !generale) return ANALYTIQUE_DASHBOARD_PATH;
  return GENERALE_DASHBOARD_PATH;
}

/** Liens du module « Tableau de bord » selon les activités et l'espace actif. */
export function resolveDashboardSidebarLinks(options: {
  generale: boolean;
  analytique: boolean;
  choice: AccountingChoice | null;
}): SidebarLink[] {
  const { generale, analytique, choice } = options;
  const links: SidebarLink[] = [];
  const both = generale && analytique && choice === null;

  if (generale && (choice === null || choice === 'generale')) {
    links.push({
      title: both ? 'Tableau de bord (CG)' : 'Tableau de bord',
      icon: LayoutDashboard,
      href: GENERALE_DASHBOARD_PATH,
    });
  }
  if (analytique && (choice === null || choice === 'analytique')) {
    links.push({
      title: both ? 'Tableau de bord (CA)' : 'Tableau de bord',
      icon: LayoutDashboard,
      href: ANALYTIQUE_DASHBOARD_PATH,
    });
  }
  return links;
}

const MODULE_HOME_PATHS: Partial<Record<ModuleKey, string>> = {
  generale: '/accounting/chart-of-accounts',
  clients: '/customers',
  fournisseurs: '/suppliers',
  analytique: ANALYTIQUE_DASHBOARD_PATH,
  analyse: '/accounting/reports',
  analyseAnalytique: '/analytique/etats',
  configurationAnalytique: '/analytique/plan',
  configuration: '/accounting/setup',
};

function filterModuleLinks(
  moduleKey: ModuleKey,
  links: SidebarLink[],
  options: {
    generale: boolean;
    analytique: boolean;
    choice: AccountingChoice | null;
    accountingRole: string | null;
  },
): SidebarLink[] {
  const { generale, analytique, choice, accountingRole } = options;

  return links.filter((link) => {
    if (moduleKey === 'analytique' && choice !== 'analytique' && choice !== null) {
      return false;
    }
    if (moduleKey === 'analyseAnalytique' && choice !== 'analytique' && choice !== null) {
      return false;
    }
    if (moduleKey === 'analyse' && choice === 'analytique') {
      return false;
    }
    if (moduleKey === 'configurationAnalytique' && choice !== 'analytique' && choice !== null) {
      return false;
    }
    if (
      (moduleKey === 'generale' ||
        moduleKey === 'configuration' ||
        moduleKey === 'analyse' ||
        moduleKey === 'clients' ||
        moduleKey === 'fournisseurs') &&
      choice === 'analytique'
    ) {
      return false;
    }
    if (!link.allowedRoles) return true;
    if (!accountingRole) return false;
    return link.allowedRoles.includes(accountingRole);
  });
}

/** Route cible lors d'un clic sur un module dans la sidebar. */
export function getModuleNavigationTarget(
  moduleKey: ModuleKey,
  options: {
    choice: AccountingChoice | null;
    generale: boolean;
    analytique: boolean;
    accountingRole: string | null;
  },
): string | null {
  const explicitHome = getModuleHomePath(moduleKey, options.choice);
  if (explicitHome) return explicitHome;

  const links =
    moduleKey === 'dashboard'
      ? resolveDashboardSidebarLinks({
          generale: options.generale,
          analytique: options.analytique,
          choice: options.choice,
        })
      : filterModuleLinks(moduleKey, modules[moduleKey].sidebarLinks, options);

  return links[0]?.href ?? null;
}

export function isPathInModule(
  pathname: string,
  moduleKey: ModuleKey,
  options: {
    choice: AccountingChoice | null;
    generale: boolean;
    analytique: boolean;
    accountingRole: string | null;
  },
): boolean {
  const links =
    moduleKey === 'dashboard'
      ? resolveDashboardSidebarLinks({
          generale: options.generale,
          analytique: options.analytique,
          choice: options.choice,
        })
      : filterModuleLinks(moduleKey, modules[moduleKey].sidebarLinks, options);

  return links.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
}

/** Première page à ouvrir lors d'un basculement de module dans la sidebar. */
export function getModuleHomePath(
  moduleKey: ModuleKey,
  choice: AccountingChoice | null,
): string | null {
  if (moduleKey === 'dashboard') {
    return getDashboardPathForChoice(choice ?? 'generale');
  }
  return MODULE_HOME_PATHS[moduleKey] ?? null;
}
