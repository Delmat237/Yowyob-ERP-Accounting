import type { UniteOeuvreDto } from './UniteOeuvreDto';

export type ApiResponseWrapperListUniteOeuvreDto = {
  success?: boolean;
  message?: string;
  data?: UniteOeuvreDto[];
  code?: number;
};
