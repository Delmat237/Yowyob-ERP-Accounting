import type { ConcordanceCalculDto } from './ConcordanceCalculDto';
import type { ConcordancePeriodeDto } from './ConcordanceCalculDto';
import type { LigneConcordanceDto } from './LigneConcordanceDto';

export type ApiResponseWrapperConcordancePeriodeDto = {
  success?: boolean;
  message?: string;
  data?: ConcordancePeriodeDto;
  code?: number;
};

export type ApiResponseWrapperConcordanceCalculDto = {
  success?: boolean;
  message?: string;
  data?: ConcordanceCalculDto;
  code?: number;
};

export type ApiResponseWrapperListLigneConcordanceDto = {
  success?: boolean;
  message?: string;
  data?: LigneConcordanceDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
