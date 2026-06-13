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
const KERNEL_BASE = process.env.NEXT_PUBLIC_KERNEL_URL ?? 'http://localhost:8080/api';

export const OpenAPI: OpenAPIConfig = {
    BASE: typeof window !== 'undefined'
        ? (window as any).__NEXT_PUBLIC_KERNEL_URL__ ?? KERNEL_BASE
        : KERNEL_BASE,
    VERSION: '1.0.0',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'include',
    TOKEN: () => Promise.resolve(typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''),
    USERNAME: undefined,
    PASSWORD: undefined,
    HEADERS: () => Promise.resolve(
        typeof window !== 'undefined'
            ? {
                'X-Tenant-ID': localStorage.getItem('organization_id') ?? '',
                // Le kernel exige les credentials client (X-Client-Id/X-Api-Key)
                // en plus du Bearer pour authentifier la requête.
                'X-Client-Id': process.env.NEXT_PUBLIC_KERNEL_CLIENT_ID ?? 'dev-platform-backend',
                'X-Api-Key': process.env.NEXT_PUBLIC_KERNEL_API_KEY ?? 'dev-api-key',
              }
            : {}
    ),
    ENCODE_PATH: undefined,
};
