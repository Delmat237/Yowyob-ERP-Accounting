import type { ChargeVentileeDto } from './ChargeVentileeDto';

export type ApiResponseWrapperChargeVentileeDto = {
  success?: boolean;
  message?: string;
  data?: ChargeVentileeDto;
  code?: number;
};

export type ApiResponseWrapperListChargeVentileeDto = {
  success?: boolean;
  message?: string;
  data?: ChargeVentileeDto[];
  code?: number;
};

export type ChargeVentileeStatsDto = {
  totalIncorporable?: number;
  totalNonIncorporable?: number;
  totalVentile?: number;
  totalNonVentile?: number;
};

export type ApiResponseWrapperChargeVentileeStatsDto = {
  success?: boolean;
  message?: string;
  data?: ChargeVentileeStatsDto;
  code?: number;
};

export type ApiResponseWrapperVoid = {
  success?: boolean;
  message?: string;
  data?: null;
  code?: number;
};
