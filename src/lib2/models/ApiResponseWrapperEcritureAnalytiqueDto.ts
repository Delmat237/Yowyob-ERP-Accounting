import type { EcritureAnalytiqueDto } from './EcritureAnalytiqueDto';

export type ApiResponseWrapperEcritureAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: EcritureAnalytiqueDto;
  code?: number;
};
