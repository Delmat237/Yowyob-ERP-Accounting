import type { RegleValorisationStockDto } from './RegleValorisationStockDto';

export type ApiResponseWrapperRegleValorisationStockDto = {
  success?: boolean;
  message?: string;
  data?: RegleValorisationStockDto;
  code?: number;
};

export type ApiResponseWrapperListRegleValorisationStockDto = {
  success?: boolean;
  message?: string;
  data?: RegleValorisationStockDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
