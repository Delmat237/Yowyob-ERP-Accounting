import type { MethodeCalculCoutDto } from './MethodeCalculCoutDto';

export type ApiResponseWrapperMethodeCalculCoutDto = {
  success?: boolean;
  message?: string;
  data?: MethodeCalculCoutDto;
  code?: number;
};

export type ApiResponseWrapperListMethodeCalculCoutDto = {
  success?: boolean;
  message?: string;
  data?: MethodeCalculCoutDto[];
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
