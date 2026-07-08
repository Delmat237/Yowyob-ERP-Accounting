import type { JournalAnalytiqueDto } from './JournalAnalytiqueDto';

export type ApiResponseWrapperJournalAnalytiqueDto = {
  success?: boolean;
  message?: string;
  data?: JournalAnalytiqueDto;
  code?: number;
};
