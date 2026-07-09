import type { ApiResponseWrapperConfigurationAnalytiqueDto } from '../models/ConfigurationAnalytiqueApiTypes';
import type { ConfigurationAnalytiqueDto } from '../models/ConfigurationAnalytiqueDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingAnalytiqueConfigService {
  public static getConfig(): CancelablePromise<ApiResponseWrapperConfigurationAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/config',
    });
  }

  public static saveConfig(
    requestBody: ConfigurationAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperConfigurationAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/config',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
