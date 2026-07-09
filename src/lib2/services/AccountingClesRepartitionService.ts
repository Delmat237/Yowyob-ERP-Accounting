import type { ApiResponseWrapperCleRepartitionDto } from '../models/ApiResponseWrapperCleRepartitionDto';
import type { ApiResponseWrapperListCleRepartitionDto } from '../models/ApiResponseWrapperListCleRepartitionDto';
import type { ApiResponseWrapperVoid } from '../models/ApiResponseWrapperVoid';
import type { CleRepartitionDto } from '../models/CleRepartitionDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingClesRepartitionService {
  public static createCle(
    requestBody: CleRepartitionDto,
  ): CancelablePromise<ApiResponseWrapperCleRepartitionDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/repartitions',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getCle(id: string): CancelablePromise<ApiResponseWrapperCleRepartitionDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/repartitions/{id}',
      path: { id },
    });
  }

  public static updateCle(
    id: string,
    requestBody: CleRepartitionDto,
  ): CancelablePromise<ApiResponseWrapperCleRepartitionDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/repartitions/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteCle(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/repartitions/{id}',
      path: { id },
    });
  }

  public static getAllCles(): CancelablePromise<ApiResponseWrapperListCleRepartitionDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/repartitions',
    });
  }

  public static getActiveCles(): CancelablePromise<ApiResponseWrapperListCleRepartitionDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/repartitions/active',
    });
  }
}
