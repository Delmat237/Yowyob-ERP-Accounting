const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Stub accounting ou libellé tronqué « Organization 492c… » */
const PLACEHOLDER_ORG_NAME_PATTERN = /^Organization\b/i;

export const DEFAULT_ORG_DISPLAY_NAME = "Mon organisation";

/** Nom technique (UUID ou stub « Organization … ») — à ne pas afficher tel quel. */
export function isPlaceholderOrgName(name?: string | null): boolean {
  if (!name?.trim()) return true;
  const trimmed = name.trim();
  if (UUID_PATTERN.test(trimmed)) return true;
  if (PLACEHOLDER_ORG_NAME_PATTERN.test(trimmed)) return true;
  return false;
}

export function pickOrgDisplayName(...candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    if (candidate && !isPlaceholderOrgName(candidate)) {
      return candidate.trim();
    }
  }
  return null;
}

/** Purge un nom technique persisté en localStorage (ex. après login ou init comptable). */
export function clearPlaceholderOrgNameFromStorage(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("organization_name");
  if (stored && isPlaceholderOrgName(stored)) {
    localStorage.removeItem("organization_name");
  }
}

type KernelOrganizationFields = {
  id?: string | null;
  name?: string | null;
  displayName?: string | null;
  shortName?: string | null;
  longName?: string | null;
  legalName?: string | null;
  organizationCode?: string | null;
};

/** Extrait le nom depuis une réponse accounting (wrapper ou DTO direct). */
export function extractAccountingOrgName(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const wrapper = response as { success?: boolean; data?: { name?: string } };
  if (wrapper.success && wrapper.data?.name) {
    return wrapper.data.name;
  }
  const direct = response as { name?: string };
  return direct.name ?? null;
}

/** Extrait un libellé affichable depuis une réponse Kernel (proxy /api/kernel/organizations). */
export function pickKernelOrgDisplayName(org?: KernelOrganizationFields | null): string | null {
  if (!org) return null;
  return pickOrgDisplayName(
    org.displayName,
    org.shortName,
    org.longName,
    org.legalName,
    org.organizationCode,
    org.name,
  );
}

/** Fallback silencieux vers le proxy Kernel — n'émet pas d'erreur console si le Kernel répond 5xx. */
export async function fetchKernelOrgDisplayNameSilently(
  orgId: string,
  fetchOrg: (id: string) => Promise<KernelOrganizationFields | null | undefined>,
): Promise<string | null> {
  try {
    const org = await fetchOrg(orgId);
    return pickKernelOrgDisplayName(org);
  } catch {
    return null;
  }
}
