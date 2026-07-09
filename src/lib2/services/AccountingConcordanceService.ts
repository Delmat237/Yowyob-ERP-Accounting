import type { ApiResponseWrapperConcordanceCalculDto } from '../models/ConcordanceApiTypes';
import type { ApiResponseWrapperConcordancePeriodeDto } from '../models/ConcordanceApiTypes';
import type { ApiResponseWrapperListLigneConcordanceDto } from '../models/ConcordanceApiTypes';
import type { LigneConcordanceDto } from '../models/LigneConcordanceDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingConcordanceService {
  public static getPeriode(
    periodeId: string,
  ): CancelablePromise<ApiResponseWrapperConcordancePeriodeDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/concordance/periodes/{periodeId}',
      path: { periodeId },
    });
  }

  public static getCalcul(
    periodeId: string,
  ): CancelablePromise<ApiResponseWrapperConcordanceCalculDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/concordance/periodes/{periodeId}/calcul',
      path: { periodeId },
    });
  }

  public static getLignes(
    periodeId: string,
  ): CancelablePromise<ApiResponseWrapperListLigneConcordanceDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/concordance/periodes/{periodeId}/lignes',
      path: { periodeId },
    });
  }

  public static replaceLignes(
    periodeId: string,
    requestBody: LigneConcordanceDto[],
  ): CancelablePromise<ApiResponseWrapperListLigneConcordanceDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/concordance/periodes/{periodeId}/lignes',
      path: { periodeId },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
