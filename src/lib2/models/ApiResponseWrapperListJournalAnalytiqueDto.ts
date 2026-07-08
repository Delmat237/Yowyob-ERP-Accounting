import type { JournalAnalytiqueDto } from './JournalAnalytiqueDto';

export type ApiResponseWrapperListJournalAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: JournalAnalytiqueDto[];
  code?: number;
};
