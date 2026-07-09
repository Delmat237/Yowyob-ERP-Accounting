import type { ApiResponseWrapperListCoutProduitDto } from '../models/CoutProduitApiTypes';
import type { ApiResponseWrapperCoutProduitDto } from '../models/CoutProduitApiTypes';
import type { ApiResponseWrapperVoid } from '../models/CoutProduitApiTypes';
import type { CoutProduitDto } from '../models/CoutProduitDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingCoutsProduitsService {
  public static createCoutProduit(
    requestBody: CoutProduitDto,
  ): CancelablePromise<ApiResponseWrapperCoutProduitDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/couts-produits',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllCoutsProduits(params?: {
    periodeId?: string;
  }): CancelablePromise<ApiResponseWrapperListCoutProduitDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/couts-produits',
      query: params,
    });
  }

  public static getCoutProduit(id: string): CancelablePromise<ApiResponseWrapperCoutProduitDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/couts-produits/{id}',
      path: { id },
    });
  }

  public static updateCoutProduit(
    id: string,
    requestBody: CoutProduitDto,
  ): CancelablePromise<ApiResponseWrapperCoutProduitDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/couts-produits/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteCoutProduit(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/couts-produits/{id}',
      path: { id },
    });
  }
}
