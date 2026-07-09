import type { ApiResponseWrapperListPrixCessionInterneDto } from '../models/PrixCessionInterneApiTypes';
import type { ApiResponseWrapperPrixCessionInterneDto } from '../models/PrixCessionInterneApiTypes';
import type { ApiResponseWrapperVoid } from '../models/PrixCessionInterneApiTypes';
import type { PrixCessionInterneDto } from '../models/PrixCessionInterneDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingPrixCessionsService {
  public static createPrixCession(
    requestBody: PrixCessionInterneDto,
  ): CancelablePromise<ApiResponseWrapperPrixCessionInterneDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/prix-cessions',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllPrixCessions(params?: {
    centreCedantId?: string;
    centreBeneficiaireId?: string;
  }): CancelablePromise<ApiResponseWrapperListPrixCessionInterneDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/prix-cessions',
      query: params,
    });
  }

  public static getPrixCession(id: string): CancelablePromise<ApiResponseWrapperPrixCessionInterneDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/prix-cessions/{id}',
      path: { id },
    });
  }

  public static updatePrixCession(
    id: string,
    requestBody: PrixCessionInterneDto,
  ): CancelablePromise<ApiResponseWrapperPrixCessionInterneDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/prix-cessions/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deletePrixCession(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/prix-cessions/{id}',
      path: { id },
    });
  }
}
