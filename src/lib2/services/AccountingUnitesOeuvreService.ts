import type { ApiResponseWrapperListUniteOeuvreDto } from '../models/ApiResponseWrapperListUniteOeuvreDto';
import type { ApiResponseWrapperUniteOeuvreDto } from '../models/ApiResponseWrapperUniteOeuvreDto';
import type { ApiResponseWrapperVoid } from '../models/ApiResponseWrapperVoid';
import type { UniteOeuvreDto } from '../models/UniteOeuvreDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingUnitesOeuvreService {
  public static createUnite(
    requestBody: UniteOeuvreDto,
  ): CancelablePromise<ApiResponseWrapperUniteOeuvreDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/unites-oeuvre',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getUnite(id: string): CancelablePromise<ApiResponseWrapperUniteOeuvreDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/unites-oeuvre/{id}',
      path: { id },
    });
  }

  public static updateUnite(
    id: string,
    requestBody: UniteOeuvreDto,
  ): CancelablePromise<ApiResponseWrapperUniteOeuvreDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/unites-oeuvre/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteUnite(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/unites-oeuvre/{id}',
      path: { id },
    });
  }

  public static getAllUnites(): CancelablePromise<ApiResponseWrapperListUniteOeuvreDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/unites-oeuvre',
    });
  }

  public static getActiveUnites(): CancelablePromise<ApiResponseWrapperListUniteOeuvreDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/unites-oeuvre/active',
    });
  }

  public static getUnitesByCentre(centreId: string): CancelablePromise<ApiResponseWrapperListUniteOeuvreDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/unites-oeuvre/by-centre/{centreId}',
      path: { centreId },
    });
  }
}
