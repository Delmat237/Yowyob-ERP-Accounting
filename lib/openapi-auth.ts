import { OpenAPI as CoreOpenAPI } from "@/src/lib";
import { OpenAPI as AccountingOpenAPI } from "@/src/lib2";

type OpenApiClient = typeof CoreOpenAPI;

const resolveToken = () =>
    Promise.resolve(
        typeof window !== "undefined" ? localStorage.getItem("auth_token") ?? "" : "",
    );

const resolveHeaders = () =>
    Promise.resolve(
        typeof window !== "undefined"
            ? (() => {
                  const tenantId =
                      localStorage.getItem("tenant_id") ||
                      process.env.NEXT_PUBLIC_TENANT_ID ||
                      "11111111-1111-1111-1111-111111111111";
                  const organizationId =
                      localStorage.getItem("organization_id") ||
                      process.env.NEXT_PUBLIC_ORGANIZATION_ID ||
                      "4e177ff2-89b8-4d24-926a-5763dfa1b19a";
                  return {
                      "X-Tenant-ID": tenantId,
                      "X-Tenant-Id": tenantId,
                      "X-Organization-Id": organizationId,
                  };
              })()
            : {},
    );

function bindClient(client: OpenApiClient): void {
    client.TOKEN = resolveToken;
    client.HEADERS = resolveHeaders;
}

/** Relit auth_token / tenant / org depuis localStorage à chaque requête (évite un JWT figé). */
export function bindOpenApiClientsFromStorage(): void {
    bindClient(CoreOpenAPI);
    bindClient(AccountingOpenAPI);
}

/** Après login : persiste le JWT puis rebind les deux clients OpenAPI (resolver dynamique). */
export function syncOpenApiTokenAfterLogin(token: string): void {
    if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
    }
    bindOpenApiClientsFromStorage();
}
