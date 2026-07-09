import type { ApiResponseWrapperRegleValorisationStockDto } from '../models/RegleValorisationStockApiTypes';
import type { ApiResponseWrapperListRegleValorisationStockDto } from '../models/RegleValorisationStockApiTypes';
import type { ApiResponseWrapperVoid } from '../models/RegleValorisationStockApiTypes';
import type { RegleValorisationStockDto } from '../models/RegleValorisationStockDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingReglesValorisationStockService {
  public static createRegle(
    requestBody: RegleValorisationStockDto,
  ): CancelablePromise<ApiResponseWrapperRegleValorisationStockDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/regles-valorisation-stock',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllRegles(): CancelablePromise<ApiResponseWrapperListRegleValorisationStockDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/regles-valorisation-stock',
    });
  }

  public static getRegle(id: string): CancelablePromise<ApiResponseWrapperRegleValorisationStockDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/regles-valorisation-stock/{id}',
      path: { id },
    });
  }

  public static updateRegle(
    id: string,
    requestBody: RegleValorisationStockDto,
  ): CancelablePromise<ApiResponseWrapperRegleValorisationStockDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/regles-valorisation-stock/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteRegle(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/regles-valorisation-stock/{id}',
      path: { id },
    });
  }
}
