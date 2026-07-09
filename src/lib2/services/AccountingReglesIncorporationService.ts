import type { ApiResponseWrapperRegleIncorporationDto } from '../models/RegleIncorporationApiTypes';
import type { ApiResponseWrapperListRegleIncorporationDto } from '../models/RegleIncorporationApiTypes';
import type { ApiResponseWrapperVoid } from '../models/RegleIncorporationApiTypes';
import type { RegleIncorporationDto } from '../models/RegleIncorporationDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingReglesIncorporationService {
  public static createRegle(
    requestBody: RegleIncorporationDto,
  ): CancelablePromise<ApiResponseWrapperRegleIncorporationDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/regles-incorporation',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllRegles(): CancelablePromise<ApiResponseWrapperListRegleIncorporationDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/regles-incorporation',
    });
  }

  public static getRegle(id: string): CancelablePromise<ApiResponseWrapperRegleIncorporationDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/regles-incorporation/{id}',
      path: { id },
    });
  }

  public static updateRegle(
    id: string,
    requestBody: RegleIncorporationDto,
  ): CancelablePromise<ApiResponseWrapperRegleIncorporationDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/regles-incorporation/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteRegle(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/regles-incorporation/{id}',
      path: { id },
    });
  }
}
