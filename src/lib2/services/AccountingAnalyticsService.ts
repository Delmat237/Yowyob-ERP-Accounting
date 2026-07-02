
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { ApiResponseWrapperAxeAnalytiqueDto } from '../models/ApiResponseWrapperAxeAnalytiqueDto';
import type { ApiResponseWrapperListAxeAnalytiqueDto } from '../models/ApiResponseWrapperListAxeAnalytiqueDto';
import type { ApiResponseWrapperVoid } from '../models/ApiResponseWrapperVoid';
import type { AxeAnalytiqueDto } from '../models/AxeAnalytiqueDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingAnalyticsService {
    public static createAxe(requestBody: AxeAnalytiqueDto): CancelablePromise<ApiResponseWrapperAxeAnalytiqueDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounting/analytics',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    public static getAxe(id: string): CancelablePromise<ApiResponseWrapperAxeAnalytiqueDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounting/analytics/{id}',
            path: { id },
        });
    }

    public static updateAxe(id: string, requestBody: AxeAnalytiqueDto): CancelablePromise<ApiResponseWrapperAxeAnalytiqueDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/accounting/analytics/{id}',
            path: { id },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    public static deleteAxe(id: string): CancelablePromise<ApiResponseWrapperVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/accounting/analytics/{id}',
            path: { id },
        });
    }

    public static getAllAxes(): CancelablePromise<ApiResponseWrapperListAxeAnalytiqueDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounting/analytics',
        });
    }

    public static getActiveAxes(): CancelablePromise<ApiResponseWrapperListAxeAnalytiqueDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounting/analytics/active',
        });
    }
}
