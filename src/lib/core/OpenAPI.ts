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

// Ce client cible le KERNEL (services users/actors/organizations/agencies/...) mais
// NE l'appelle PLUS en direct : il passe par le reverse-proxy du backend accounting
// (/api/kernel/**), qui détient seul les credentials de la ClientApplication du Kernel
// (X-Client-Id / X-Api-Key) et les injecte côté serveur. Ces secrets ne doivent jamais
// être exposés dans le bundle navigateur. Les chemins générés sont sans préfixe /api ;
// le préfixe vers le Kernel est reconstruit par le proxy backend.
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081';
const KERNEL_PROXY_BASE = `${BACKEND_BASE}/api/kernel`;

export const OpenAPI: OpenAPIConfig = {
    BASE: KERNEL_PROXY_BASE,
    VERSION: '1.0.0',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'include',
    TOKEN: () => Promise.resolve(typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''),
    USERNAME: undefined,
    PASSWORD: undefined,
    HEADERS: () => Promise.resolve(
        typeof window !== 'undefined'
            ? {
                // X-Tenant-ID = le TENANT (≠ organisation). Au login, le
                // localStorage est vide → on retombe sur NEXT_PUBLIC_TENANT_ID
                // (configurable dans .env.local), sinon ''.
                'X-Tenant-ID': localStorage.getItem('tenant_id')
                    || process.env.NEXT_PUBLIC_TENANT_ID
                    || '',
                // X-Organization-Id : organisation courante (relayée par le proxy au Kernel).
                'X-Organization-Id': localStorage.getItem('organization_id')
                    || process.env.NEXT_PUBLIC_ORGANIZATION_ID
                    || '',
                // NB : X-Client-Id / X-Api-Key NE sont plus envoyés par le navigateur.
                // Le proxy backend (/api/kernel) les injecte côté serveur.
              }
            : {}
    ),
    ENCODE_PATH: undefined,
};
