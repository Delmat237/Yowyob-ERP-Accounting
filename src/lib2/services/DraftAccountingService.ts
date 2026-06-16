/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseWrapperBrouillardComptableDto } from '../models/ApiResponseWrapperBrouillardComptableDto';
import type { BrouillardComptableDto } from '../models/BrouillardComptableDto';
import type { BrouillardRejectionRequest } from '../models/BrouillardRejectionRequest';
import type { BrouillardValidationRequest } from '../models/BrouillardValidationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DraftAccountingService {
    /**
     * Validate a draft entry and create accounting entry
     * @param id
     * @param requestBody
     * @returns ApiResponseWrapperBrouillardComptableDto OK
     * @throws ApiError
     */
    public static validateBrouillard(
        id: string,
        requestBody?: BrouillardValidationRequest,
    ): CancelablePromise<ApiResponseWrapperBrouillardComptableDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounting/brouillards/{id}/validate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a draft entry
     * @param id
     * @param requestBody
     * @returns ApiResponseWrapperBrouillardComptableDto OK
     * @throws ApiError
     */
    public static rejectBrouillard(
        id: string,
        requestBody: BrouillardRejectionRequest,
    ): CancelablePromise<ApiResponseWrapperBrouillardComptableDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounting/brouillards/{id}/reject',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all draft entries
     * @param statut
     * @param type
     * @param page
     * @param size
     * @returns BrouillardComptableDto OK
     * @throws ApiError
     */
    public static getAllBrouillards(
        statut?: 'BROUILLON' | 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REJETE',
        type?: 'FACTURE_CLIENT' | 'FACTURE_FOURNISSEUR' | 'MOUVEMENT_STOCK' | 'MOUVEMENT_CAISSE' | 'OPERATION_BANCAIRE' | 'AUTRE',
        page?: number,
        size: number = 20,
    ): CancelablePromise<Array<BrouillardComptableDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounting/brouillards',
            query: {
                'statut': statut,
                'type': type,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * Get a draft entry by ID
     * @param id
     * @returns BrouillardComptableDto OK
     * @throws ApiError
     */
    public static getBrouillardById(
        id: string,
    ): CancelablePromise<BrouillardComptableDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounting/brouillards/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Delete a draft entry
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteBrouillard(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/accounting/brouillards/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**

     * Create a new draft entry
     * @param requestBody
     * @returns ApiResponseWrapperBrouillardComptableDto OK
     * @throws ApiError
     */
    public static createBrouillard(
        requestBody: BrouillardComptableDto,
    ): CancelablePromise<ApiResponseWrapperBrouillardComptableDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounting/brouillards',
            body: requestBody,
            mediaType: 'application/json',

        });
    }
    /**
     * Upload an invoice document, run OCR and persist it as a pending draft (brouillard)
     * scoped to the current organization.
     * @param formData
     * @returns ApiResponseWrapperBrouillardComptableDto OK
     * @throws ApiError
     */
    public static uploadDraftFromInvoice(
        formData?: {
            file: Blob;
        },
    ): CancelablePromise<ApiResponseWrapperBrouillardComptableDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounting/brouillards/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
