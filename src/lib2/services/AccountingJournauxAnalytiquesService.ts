import type { ApiResponseWrapperJournalAnalytiqueDto } from '../models/ApiResponseWrapperJournalAnalytiqueDto';
import type { ApiResponseWrapperListJournalAnalytiqueDto } from '../models/ApiResponseWrapperListJournalAnalytiqueDto';
import type { ApiResponseWrapperVoid } from '../models/ApiResponseWrapperVoid';
import type { JournalAnalytiqueDto } from '../models/JournalAnalytiqueDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountingJournauxAnalytiquesService {
  public static createJournal(
    requestBody: JournalAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperJournalAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/accounting/analytique/journaux',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static getJournal(id: string): CancelablePromise<ApiResponseWrapperJournalAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/journaux/{id}',
      path: { id },
    });
  }

  public static updateJournal(
    id: string,
    requestBody: JournalAnalytiqueDto,
  ): CancelablePromise<ApiResponseWrapperJournalAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/accounting/analytique/journaux/{id}',
      path: { id },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  public static deleteJournal(id: string): CancelablePromise<ApiResponseWrapperVoid> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/accounting/analytique/journaux/{id}',
      path: { id },
    });
  }

  public static getAllJournaux(): CancelablePromise<ApiResponseWrapperListJournalAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/journaux',
    });
  }

  public static getActiveJournaux(): CancelablePromise<ApiResponseWrapperListJournalAnalytiqueDto> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/accounting/analytique/journaux/active',
    });
  }
}
