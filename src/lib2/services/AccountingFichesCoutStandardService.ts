import type { ApiResponseWrapperListFicheCoutStandardDto } from '../models/FicheCoutStandardApiTypes';
import type { ApiResponseWrapperFicheCoutStandardDto } from '../models/FicheCoutStandardApiTypes';
import type { ApiResponseWrapperVoid } from '../models/FicheCoutStandardApiTypes';
import type { FicheCoutStandardDto } from '../models/FicheCoutStandardDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingFichesCoutStandardService {
  public static createFicheCoutStandard(
    requestBody: FicheCoutStandardDto,
  ): CancelablePromise<ApiResponseWrapperFicheCoutStandardDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/fiches-cout-standard',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllFichesCoutStandard(params?: {
    periodeRefId?: string;
  }): CancelablePromise<ApiResponseWrapperListFicheCoutStandardDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/fiches-cout-standard',
      query: params,
    });
  }

  public static getFicheCoutStandard(id: string): CancelablePromise<ApiResponseWrapperFicheCoutStandardDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/fiches-cout-standard/{id}',
      path: { id },
    });
  }

  public static updateFicheCoutStandard(
    id: string,
    requestBody: FicheCoutStandardDto,
  ): CancelablePromise<ApiResponseWrapperFicheCoutStandardDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/fiches-cout-standard/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteFicheCoutStandard(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/fiches-cout-standard/{id}',
      path: { id },
    });
  }
}
