import type { UniteOeuvreDto } from './UniteOeuvreDto';

export type ApiResponseWrapperUniteOeuvreDto = {
  success?: boolean;
  message?: string;
  data?: UniteOeuvreDto;
  code?: number;
};
