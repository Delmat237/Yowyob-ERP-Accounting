import type { FicheCoutStandardDto } from './FicheCoutStandardDto';

export type ApiResponseWrapperFicheCoutStandardDto = {
  success?: boolean;
  message?: string;
  data?: FicheCoutStandardDto;
  code?: number;
};

export type ApiResponseWrapperListFicheCoutStandardDto = {
  success?: boolean;
  message?: string;
  data?: FicheCoutStandardDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
