import {
  clearAccountingChoice,
  getAccountingChoice,
  setAccountingChoice,
  type AccountingChoice,
} from '@/lib/accounting-choice';

/**
 * Choix d'espace comptable valide au regard de l'abonnement organisation
 * (paramétrage CG → Activités comptables).
 */
export function resolveAccountingChoiceForSubscription(
  stored: AccountingChoice | null,
  generale: boolean,
  analytique: boolean,
): AccountingChoice | null {
  if (stored === 'analytique' && !analytique) {
    return generale ? 'generale' : null;
  }
  if (stored === 'generale' && !generale) {
    return analytique ? 'analytique' : null;
  }
  if (stored) return stored;

  if (generale && analytique) return null;
  if (generale) return 'generale';
  if (analytique) return 'analytique';
  return null;
}

/** Aligne sessionStorage avec l'abonnement si le choix stocké n'est plus valide. */
export function syncStoredAccountingChoiceWithSubscription(
  generale: boolean,
  analytique: boolean,
): AccountingChoice | null {
  const stored = getAccountingChoice();
  const resolved = resolveAccountingChoiceForSubscription(stored, generale, analytique);

  if (resolved === stored) return resolved;

  if (resolved) setAccountingChoice(resolved);
  else clearAccountingChoice();

  return resolved;
}

/** Choix d'espace pour la sidebar (un seul espace CG ou CA à la fois). */
export function resolveSidebarWorkspaceChoice(
  choice: AccountingChoice | null,
  generale: boolean,
  analytique: boolean,
): AccountingChoice | null {
  const resolved = resolveAccountingChoiceForSubscription(choice, generale, analytique);
  if (resolved) return resolved;

  if (generale && analytique) {
    return getAccountingChoice() ?? 'generale';
  }
  return null;
}
