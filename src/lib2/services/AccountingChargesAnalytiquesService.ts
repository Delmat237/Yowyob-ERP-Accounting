import type { ApiResponseWrapperChargeAnalytiqueDto } from '../models/ChargeAnalytiqueApiTypes';
import type { ApiResponseWrapperListChargeAnalytiqueDto } from '../models/ChargeAnalytiqueApiTypes';
import type { ApiResponseWrapperVoid } from '../models/ChargeAnalytiqueApiTypes';
import type { ChargeAnalytiqueDto } from '../models/ChargeAnalytiqueDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingChargesAnalytiquesService {
  public static createCharge(
    requestBody: ChargeAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperChargeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/charges',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllCharges(params?: {
    periodeId?: string;
    type?: string;
  }): CancelablePromise<ApiResponseWrapperListChargeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/charges',
      query: params,
    });
  }

  public static getCharge(id: string): CancelablePromise<ApiResponseWrapperChargeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/charges/{id}',
      path: { id },
    });
  }

  public static updateCharge(
    id: string,
    requestBody: ChargeAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperChargeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/charges/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteCharge(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/charges/{id}',
      path: { id },
    });
  }
}
