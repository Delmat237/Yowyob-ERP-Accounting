import type { CleRepartitionDto } from './CleRepartitionDto';

export type ApiResponseWrapperListCleRepartitionDto = {
  success?: boolean;
  message?: string;
  data?: CleRepartitionDto[];
  code?: number;
};
