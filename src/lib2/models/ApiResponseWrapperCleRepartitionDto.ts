import type { CleRepartitionDto } from './CleRepartitionDto';

export type ApiResponseWrapperCleRepartitionDto = {
  success?: boolean;
  message?: string;
  data?: CleRepartitionDto;
  code?: number;
};
