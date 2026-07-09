import type { ConfigurationAnalytiqueDto } from './ConfigurationAnalytiqueDto';

export type ApiResponseWrapperConfigurationAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: ConfigurationAnalytiqueDto;
  code?: number;
};
