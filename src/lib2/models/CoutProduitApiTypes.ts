import type { CoutProduitDto } from './CoutProduitDto';

export type ApiResponseWrapperCoutProduitDto = {
  success?: boolean;
  message?: string;
  data?: CoutProduitDto;
  code?: number;
};

export type ApiResponseWrapperListCoutProduitDto = {
  success?: boolean;
  message?: string;
  data?: CoutProduitDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
