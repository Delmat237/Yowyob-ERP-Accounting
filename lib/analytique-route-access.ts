import { AccountingRoles, type AccountingRole } from '@/src/lib/auth/roles';

/** Les trois rôles du module comptable (CG + CA). */
export const ANALYTIQUE_ALL_ROLES: AccountingRole[] = [
  AccountingRoles.AIDE_COMPTABLE,
  AccountingRoles.COMPTABLE,
  AccountingRoles.RESPONSABLE_COMPTABLE,
];

/** Comptable et responsable (exclut l'aide-comptable). */
export const ANALYTIQUE_COMPTABLE_PLUS: AccountingRole[] = [
  AccountingRoles.COMPTABLE,
  AccountingRoles.RESPONSABLE_COMPTABLE,
];

/** Responsable comptable uniquement. */
export const ANALYTIQUE_RESPONSABLE_ONLY: AccountingRole[] = [
  AccountingRoles.RESPONSABLE_COMPTABLE,
];

/** Routes CA absentes de la sidebar mais ouvertes à tous les rôles comptables. */
export const ANALYTIQUE_ROUTE_ROLE_OVERRIDES: Record<string, AccountingRole[]> = {
  '/analytique/profile': ANALYTIQUE_ALL_ROLES,
};

export function isResponsableComptable(role: string | null | undefined): boolean {
  return role === AccountingRoles.RESPONSABLE_COMPTABLE;
}

export function hasAnalytiqueRole(
  role: string | null | undefined,
  allowed: readonly AccountingRole[],
): boolean {
  if (!role) return false;
  return allowed.includes(role as AccountingRole);
}
