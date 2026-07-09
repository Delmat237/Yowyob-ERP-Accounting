import type { ApiResponseWrapperChargeVentileeDto } from '../models/ChargeVentileeApiTypes';
import type { ApiResponseWrapperChargeVentileeStatsDto } from '../models/ChargeVentileeApiTypes';
import type { ApiResponseWrapperListChargeVentileeDto } from '../models/ChargeVentileeApiTypes';
import type { ApiResponseWrapperVoid } from '../models/ChargeVentileeApiTypes';
import type { ChargeVentileeDto } from '../models/ChargeVentileeDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingChargesVentileesService {
  public static createCharge(
    requestBody: ChargeVentileeDto,
  ): CancelablePromise<ApiResponseWrapperChargeVentileeDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/charges-ventilees',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getAllCharges(params?: {
    periodeId?: string;
    incorporable?: boolean;
  }): CancelablePromise<ApiResponseWrapperListChargeVentileeDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/charges-ventilees',
      query: params,
    });
  }

  public static getStats(params?: {
    periodeId?: string;
  }): CancelablePromise<ApiResponseWrapperChargeVentileeStatsDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/charges-ventilees/stats',
      query: params,
    });
  }

  public static getCharge(id: string): CancelablePromise<ApiResponseWrapperChargeVentileeDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/charges-ventilees/{id}',
      path: { id },
    });
  }

  public static updateCharge(
    id: string,
    requestBody: ChargeVentileeDto,
  ): CancelablePromise<ApiResponseWrapperChargeVentileeDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/charges-ventilees/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteCharge(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/charges-ventilees/{id}',
      path: { id },
    });
  }
}
