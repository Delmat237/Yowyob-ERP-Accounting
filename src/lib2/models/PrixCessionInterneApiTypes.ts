import type { PrixCessionInterneDto } from './PrixCessionInterneDto';

export type ApiResponseWrapperPrixCessionInterneDto = {
  success?: boolean;
  message?: string;
  data?: PrixCessionInterneDto;
  code?: number;
};

export type ApiResponseWrapperListPrixCessionInterneDto = {
  success?: boolean;
  message?: string;
  data?: PrixCessionInterneDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
