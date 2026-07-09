import type { EcritureAnalytiqueDto } from './EcritureAnalytiqueDto';

export type ImportCgResultDto = {
  created?: EcritureAnalytiqueDto[];
  ignored?: number;
  errors?: string[];
};
