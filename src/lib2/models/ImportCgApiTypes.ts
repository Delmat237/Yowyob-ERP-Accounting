import type { ImportCgResultDto } from './ImportCgResultDto';

export type ApiResponseWrapperImportCgResultDto = {
  success?: boolean;
  message?: string;
  data?: ImportCgResultDto;
  code?: number;
};
