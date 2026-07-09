import type { ApiResponseWrapperEcritureAnalytiqueDto } from '../models/ApiResponseWrapperEcritureAnalytiqueDto';
import type { ApiResponseWrapperListEcritureAnalytiqueDto } from '../models/ApiResponseWrapperListEcritureAnalytiqueDto';
import type { ApiResponseWrapperImportCgResultDto } from '../models/ImportCgApiTypes';
import type { EcritureAnalytiqueDto } from '../models/EcritureAnalytiqueDto';
import type { ImportCgRequestDto } from '../models/ImportCgRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingEcrituresAnalytiquesService {
  public static createEcriture(
    requestBody: EcritureAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperEcritureAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/ecritures',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllEcritures(
    statut?: string,
    periodeId?: string,
  ): CancelablePromise<ApiResponseWrapperListEcritureAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/ecritures',
      query: {
        statut,
        periodeId,
      },
    });
  }

  public static getEcriture(id: string): CancelablePromise<ApiResponseWrapperEcritureAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/ecritures/{id}',
      path: { id },
    });
  }

  public static validerEcriture(id: string): CancelablePromise<ApiResponseWrapperEcritureAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/ecritures/{id}/valider',
      path: { id },
    });
  }

  public static rejeterEcriture(
    id: string,
    requestBody: { raison: string },
  ): CancelablePromise<ApiResponseWrapperEcritureAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/ecritures/{id}/rejeter',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static importCg(
    requestBody?: ImportCgRequestDto,
  ): CancelablePromise<ApiResponseWrapperImportCgResultDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/ecritures/import-cg',
      body: requestBody ?? {},
      mediaType: 'application/json',
    });
  }
}
