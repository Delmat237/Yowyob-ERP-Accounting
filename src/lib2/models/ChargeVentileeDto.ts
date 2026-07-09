import type { VentilationAxeDto } from './VentilationAxeDto';

export type ChargeVentileeDto = {
  id?: string;
  chargeSourceId?: string;
  compteCG: string;
  libelle: string;
  montantTotal: number;
  incorporable?: boolean;
  periodeId?: string;
  periodeCgId?: string;
  ventilations?: VentilationAxeDto[];
};
