import type { ApiResponseWrapperListPeriodeAnalytiqueDto } from '../models/ApiResponseWrapperListPeriodeAnalytiqueDto';
import type { ApiResponseWrapperPeriodeAnalytiqueDto } from '../models/ApiResponseWrapperPeriodeAnalytiqueDto';
import type { ApiResponseWrapperVoid } from '../models/ApiResponseWrapperVoid';
import type { PeriodeAnalytiqueDto } from '../models/PeriodeAnalytiqueDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingPeriodesAnalytiquesService {
  public static createPeriode(
    requestBody: PeriodeAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperPeriodeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/periodes',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getPeriode(id: string): CancelablePromise<ApiResponseWrapperPeriodeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/periodes/{id}',
      path: { id },
    });
  }

  public static updatePeriode(
    id: string,
    requestBody: PeriodeAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperPeriodeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/periodes/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deletePeriode(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/periodes/{id}',
      path: { id },
    });
  }

  public static getAllPeriodes(): CancelablePromise<ApiResponseWrapperListPeriodeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/periodes',
    });
  }

  public static getPeriodesByStatut(statut: string): CancelablePromise<ApiResponseWrapperListPeriodeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/periodes/statut/{statut}',
      path: { statut },
    });
  }

  public static getPeriodesByExercice(
    exerciceId: string,
  ): CancelablePromise<ApiResponseWrapperListPeriodeAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/periodes/exercice/{exerciceId}',
      path: { exerciceId },
    });
  }
}
