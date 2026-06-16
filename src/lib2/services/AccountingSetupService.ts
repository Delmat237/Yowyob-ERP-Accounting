/* Hand-written companion to the generated accounting client.
 * Mirrors the openapi-typescript-codegen style so it reuses the same OpenAPI config
 * (base URL :8081, Authorization token, X-Organization-Id / X-Tenant-Id headers). */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export type AccountingSetupRequest = {
    planComptable?: boolean;
    journaux?: boolean;
    exercice?: boolean;
    periodes?: boolean;
    operations?: boolean;
    /** Target fiscal year; defaults to the current calendar year when omitted. */
    year?: number;
};

export type AccountingSetupStepResult = {
    key?: string;
    label?: string;
    /** CREATED | ALREADY_PRESENT | MISSING | SKIPPED | ERROR */
    status?: string;
    detail?: string;
};

export type AccountingSetupResponse = {
    organizationId?: string;
    year?: number;
    steps?: Array<AccountingSetupStepResult>;
};

export type ApiResponseWrapperAccountingSetupResponse = {
    success?: boolean;
    message?: string;
    data?: AccountingSetupResponse;
};

export class AccountingSetupService {
    /**
     * Initialise les composants comptables sélectionnés pour l'organisation courante.
     * Idempotent — rejouable sans risque. Réservé ADMIN / RESPONSABLE_COMPTABLE.
     */
    public static runSetup(
        requestBody: AccountingSetupRequest,
    ): CancelablePromise<ApiResponseWrapperAccountingSetupResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounting/setup',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /** État d'initialisation des composants comptables de l'organisation courante. */
    public static getStatus(
        year?: number,
    ): CancelablePromise<ApiResponseWrapperAccountingSetupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounting/setup/status',
            query: {
                year: year,
            },
        });
    }
}
