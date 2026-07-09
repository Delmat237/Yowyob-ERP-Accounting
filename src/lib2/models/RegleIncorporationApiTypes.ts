import type { RegleIncorporationDto } from './RegleIncorporationDto';

export type ApiResponseWrapperRegleIncorporationDto = {
  success?: boolean;
  message?: string;
  data?: RegleIncorporationDto;
  code?: number;
};

export type ApiResponseWrapperListRegleIncorporationDto = {
  success?: boolean;
  message?: string;
  data?: RegleIncorporationDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
