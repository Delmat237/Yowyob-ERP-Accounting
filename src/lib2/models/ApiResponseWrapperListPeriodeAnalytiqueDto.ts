import type { PeriodeAnalytiqueDto } from './PeriodeAnalytiqueDto';

export type ApiResponseWrapperListPeriodeAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: PeriodeAnalytiqueDto[];
  code?: number;
};
