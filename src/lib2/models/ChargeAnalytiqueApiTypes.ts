import type { ChargeAnalytiqueDto } from './ChargeAnalytiqueDto';

export type ApiResponseWrapperChargeAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: ChargeAnalytiqueDto;
  code?: number;
};

export type ApiResponseWrapperListChargeAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: ChargeAnalytiqueDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
