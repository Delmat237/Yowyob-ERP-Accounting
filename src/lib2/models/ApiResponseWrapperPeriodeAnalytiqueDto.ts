import type { PeriodeAnalytiqueDto } from './PeriodeAnalytiqueDto';

export type ApiResponseWrapperPeriodeAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: PeriodeAnalytiqueDto;
  code?: number;
};
