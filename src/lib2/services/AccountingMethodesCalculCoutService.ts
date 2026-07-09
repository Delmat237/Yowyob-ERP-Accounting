import type { ApiResponseWrapperMethodeCalculCoutDto } from '../models/MethodeCalculCoutApiTypes';
import type { ApiResponseWrapperListMethodeCalculCoutDto } from '../models/MethodeCalculCoutApiTypes';
import type { ApiResponseWrapperVoid } from '../models/MethodeCalculCoutApiTypes';
import type { MethodeCalculCoutDto } from '../models/MethodeCalculCoutDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingMethodesCalculCoutService {
  public static createMethode(
    requestBody: MethodeCalculCoutDto,
  ): CancelablePromise<ApiResponseWrapperMethodeCalculCoutDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/methodes-calcul-cout',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllMethodes(params?: {
    planAnalytiqueId?: string;
    statut?: string;
  }): CancelablePromise<ApiResponseWrapperListMethodeCalculCoutDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/methodes-calcul-cout',
      query: params,
    });
  }

  public static getMethode(id: string): CancelablePromise<ApiResponseWrapperMethodeCalculCoutDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/methodes-calcul-cout/{id}',
      path: { id },
    });
  }

  public static updateMethode(
    id: string,
    requestBody: MethodeCalculCoutDto,
  ): CancelablePromise<ApiResponseWrapperMethodeCalculCoutDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/methodes-calcul-cout/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteMethode(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/methodes-calcul-cout/{id}',
      path: { id },
    });
  }
}
