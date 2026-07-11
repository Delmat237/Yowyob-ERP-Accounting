/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;
type Headers = Record<string, string>;

export type OpenAPIConfig = {
    BASE: string;
    VERSION: string;
    WITH_CREDENTIALS: boolean;
    CREDENTIALS: 'include' | 'omit' | 'same-origin';
    TOKEN?: string | Resolver<string> | undefined;
    USERNAME?: string | Resolver<string> | undefined;
    PASSWORD?: string | Resolver<string> | undefined;
    HEADERS?: Headers | Resolver<Headers> | undefined;
    ENCODE_PATH?: ((path: string) => string) | undefined;
};

// Ce client cible le KERNEL (services users/actors/organizations/agencies/...),
// distinct du backend accounting (src/lib2 → NEXT_PUBLIC_API_URL). Les chemins
// générés sont sans préfixe /api, on le porte donc dans la base URL du kernel.

export const OpenAPI: OpenAPIConfig = {
    BASE: typeof window !== 'undefined'
        ? ((window as any).__NEXT_PUBLIC_API_URL__ ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://accounting.yowyob.com/accounting-api').replace(/\/+$/, '')
        : (process.env.NEXT_PUBLIC_API_URL ?? 'https://accounting.yowyob.com/accounting-api').replace(/\/+$/, ''),
    VERSION: '1.0.0',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'include',
    TOKEN: () => Promise.resolve(typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''),
    USERNAME: undefined,
    PASSWORD: undefined,
    // Tenant and organization are DISTINCT (aligned with the kernel):
    //   - X-Organization-Id: the business unit owning the data (localStorage 'organization_id',
    //     falling back to NEXT_PUBLIC_ORGANIZATION_ID then the seeded default org). The backend has
    //     app.organization.require-explicit=true and rejects requests with an empty header, so we
    //     must never send '' — otherwise GETs fail with "no organization context".
    //   - X-Tenant-Id: the platform customer (localStorage 'tenant_id', defaulting to the platform tenant)
    HEADERS: () => Promise.resolve(
        typeof window !== 'undefined'
            ? (() => {
                const tenantId = localStorage.getItem('tenant_id')
                    || process.env.NEXT_PUBLIC_TENANT_ID
                    || '11111111-1111-1111-1111-111111111111';
                const organizationId = localStorage.getItem('organization_id')
                    || process.env.NEXT_PUBLIC_ORGANIZATION_ID
                    || '4e177ff2-89b8-4d24-926a-5763dfa1b19a';
                return {
                    'X-Tenant-ID': tenantId,
                    'X-Tenant-Id': tenantId,
                    'X-Organization-Id': organizationId,
                };
            })()
            : {}
    ),
    ENCODE_PATH: undefined,
};
