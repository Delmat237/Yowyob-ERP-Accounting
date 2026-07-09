import type { EcritureAnalytiqueDto } from './EcritureAnalytiqueDto';

export type ApiResponseWrapperListEcritureAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: EcritureAnalytiqueDto[];
  code?: number;
};
