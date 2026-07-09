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

/** Fallback silencieux via fetch direct (n'utilise pas le client généré → pas de logout sur 401 Kernel). */
export async function fetchKernelOrgNameRaw(orgId: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "https://accounting.yowyob.com/accounting-api";
  const token = localStorage.getItem("auth_token");
  const tenantId =
    localStorage.getItem("tenant_id") ||
    process.env.NEXT_PUBLIC_TENANT_ID ||
    "11111111-1111-1111-1111-111111111111";
  const organizationId =
    localStorage.getItem("organization_id") ||
    process.env.NEXT_PUBLIC_ORGANIZATION_ID ||
    "";

  const headers: Record<string, string> = {
    "X-Tenant-Id": tenantId,
    "X-Tenant-ID": tenantId,
    "X-Organization-Id": organizationId,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const parseOrgList = (json: unknown): KernelOrganizationFields[] => {
    if (!json || typeof json !== "object") return [];
    const wrapper = json as { data?: unknown };
    const payload = wrapper.data ?? json;
    return Array.isArray(payload) ? (payload as KernelOrganizationFields[]) : [];
  };

  const parseOrg = (json: unknown): KernelOrganizationFields | null => {
    if (!json || typeof json !== "object") return null;
    const wrapper = json as { data?: KernelOrganizationFields };
    return wrapper.data ?? (json as KernelOrganizationFields);
  };

  try {
    const myRes = await fetch(`${base}/api/kernel/organizations/my`, { headers });
    if (myRes.ok) {
      const myJson = await myRes.json();
      const match = parseOrgList(myJson).find((o) => o.id === orgId);
      const name = pickKernelOrgDisplayName(match);
      if (name) return name;
    }

    const byIdRes = await fetch(`${base}/api/kernel/organizations/${orgId}`, { headers });
    if (byIdRes.ok) {
      const byIdJson = await byIdRes.json();
      return pickKernelOrgDisplayName(parseOrg(byIdJson));
    }
  } catch {
    // silencieux
  }

  return null;
}

/** @deprecated Préférer fetchKernelOrgNameRaw pour éviter le logout automatique sur 401 Kernel. */
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
