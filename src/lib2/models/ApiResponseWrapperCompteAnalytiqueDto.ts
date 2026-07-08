import type { CompteAnalytiqueDto } from './CompteAnalytiqueDto';

export type ApiResponseWrapperCompteAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: CompteAnalytiqueDto;
  timestamp?: string;
  traceId?: string;
  path?: string;
  code?: number;
};
