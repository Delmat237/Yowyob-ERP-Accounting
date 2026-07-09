import type { CleRepartitionLigneDto } from './CleRepartitionLigneDto';

export type CleRepartitionDto = {
  id?: string;
  code: string;
  libelle: string;
  type: string;
  actif?: boolean;
  lignes?: CleRepartitionLigneDto[];
};
