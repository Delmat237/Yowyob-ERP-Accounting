import type { ApiResponseWrapperCompteAnalytiqueDto } from '../models/ApiResponseWrapperCompteAnalytiqueDto';
import type { ApiResponseWrapperListCompteAnalytiqueDto } from '../models/ApiResponseWrapperListCompteAnalytiqueDto';
import type { ApiResponseWrapperVoid } from '../models/ApiResponseWrapperVoid';
import type { CompteAnalytiqueDto } from '../models/CompteAnalytiqueDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingComptesAnalytiquesService {
  public static createCompte(
    requestBody: CompteAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperCompteAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytics/comptes',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getCompte(id: string): CancelablePromise<ApiResponseWrapperCompteAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytics/comptes/{id}',
      path: { id },
    });
  }

  public static updateCompte(
    id: string,
    requestBody: CompteAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperCompteAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytics/comptes/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteCompte(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytics/comptes/{id}',
      path: { id },
    });
  }

  public static getAllComptes(): CancelablePromise<ApiResponseWrapperListCompteAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytics/comptes',
    });
  }

  public static getActiveComptes(): CancelablePromise<ApiResponseWrapperListCompteAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytics/comptes/active',
    });
  }
}
