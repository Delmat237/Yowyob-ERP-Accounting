/* Hand-written companion to the generated accounting client.
 * Mirrors the openapi-typescript-codegen style so it reuses the same OpenAPI config
 * (base URL :8081, Authorization token, X-Organization-Id / X-Tenant-Id headers). */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export type AccountingSubscriptionDto = {
    id?: string;
    /** Comptabilité générale active pour l'organisation. */
    generale?: boolean;
    /** Comptabilité analytique active pour l'organisation. */
    analytique?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type ApiResponseWrapperAccountingSubscriptionDto = {
    success?: boolean;
    message?: string;
    data?: AccountingSubscriptionDto;
};

export class AccountingSubscriptionService {
    /**
     * Abonnement aux activités comptables (Générale / Analytique) de l'organisation courante.
     * Retourne un défaut (générale active, analytique inactive) si aucun abonnement n'existe encore.
     */
    public static getSubscription(): CancelablePromise<ApiResponseWrapperAccountingSubscriptionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounting/subscriptions',
        });
    }

    /**
     * Met à jour l'abonnement de l'organisation courante.
     * Réservé au responsable comptable / administrateur (SUPERVISE).
     */
    public static updateSubscription(
        requestBody: { generale: boolean; analytique: boolean },
    ): CancelablePromise<ApiResponseWrapperAccountingSubscriptionDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/accounting/subscriptions',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
