import type { CompteAnalytiqueDto } from '@/src/lib2/models/CompteAnalytiqueDto';
import type { AxeAnalytiqueDto } from '@/src/lib2/models/AxeAnalytiqueDto';
import type { JournalAnalytiqueDto } from '@/src/lib2/models/JournalAnalytiqueDto';
import type { PeriodeAnalytiqueDto } from '@/src/lib2/models/PeriodeAnalytiqueDto';
import type { UniteOeuvreDto } from '@/src/lib2/models/UniteOeuvreDto';
import type {
  CentreAnalyse,
  CompteAnalytique,
  NatureUO,
  PeriodeCG,
  StatutPeriode,
  TypeCentre,
  UniteOeuvre,
} from '@/lib/analytique/mock-data';
import type { ClasseAnalytique } from '@/lib/analytique/classes-analytiques';
import type {
  JournalAnalytiqueConfig,
  TypeJournalAnalytique,
} from '@/lib/analytique/journal-analytique';
import { buildCodeFromLibelle } from '@/lib/analytique/analytique-api';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const JOURNAL_TYPE_TO_API: Record<TypeJournalAnalytique, string> = {
  OPERATIONS_DIRECTES: 'CHARGES',
  VIREMENTS_RECLASSEMENTS: 'REPARTITION',
  CHARGES_SUPPLEMENTAIRES: 'CORRECTION',
};

const JOURNAL_TYPE_FROM_API: Record<string, TypeJournalAnalytique> = {
  CHARGES: 'OPERATIONS_DIRECTES',
  PRODUITS: 'OPERATIONS_DIRECTES',
  REPARTITION: 'VIREMENTS_RECLASSEMENTS',
  CORRECTION: 'CHARGES_SUPPLEMENTAIRES',
};

const UNITE_TO_API: Record<string, string> = {
  h: 'HEURE_MACHINE',
  hm: 'HEURE_MACHINE',
  kg: 'KG',
  kwh: 'KWH',
  m2: 'M2',
  mod: 'HEURE_MOD',
  fcfa: 'HEURE_MOD',
};

const UNITE_FROM_API: Record<string, string> = {
  HEURE_MACHINE: 'h',
  KG: 'kg',
  KWH: 'kwh',
  M2: 'm2',
  HEURE_MOD: 'MOD',
};

export function mapCompteDtoToUi(dto: CompteAnalytiqueDto): CompteAnalytique {
  const numero = dto.code ?? '';
  return {
    id: dto.id ?? '',
    numero,
    libelle: dto.libelle ?? '',
    classe: (dto.classe?.slice(0, 2) ?? '92') as ClasseAnalytique,
    actif: dto.actif ?? true,
    compteCGMiroir: dto.compteGeneralNo,
    description: dto.nature ? `Nature : ${dto.nature}` : undefined,
  };
}

export function mapCompteUiToDto(data: Partial<CompteAnalytique>): CompteAnalytiqueDto {
  const numero = data.numero?.trim() ?? '';
  return {
    id: data.id && UUID_PATTERN.test(data.id) ? data.id : undefined,
    code: numero,
    libelle: data.libelle?.trim() ?? '',
    classe: data.classe ?? numero.slice(0, 2),
    nature: numero.startsWith('7') ? 'PRODUIT' : numero.startsWith('9') ? 'CHARGE_INDIRECTE' : 'CHARGE_DIRECTE',
    actif: data.actif ?? true,
  };
}

export function mapCentreDtoToUi(dto: AxeAnalytiqueDto): CentreAnalyse {
  const nature: TypeCentre =
    dto.typeCentre === 'AUXILIAIRE' || dto.typeCentre === 'FICTIF'
      ? 'CENTRE_AUXILIAIRE'
      : 'CENTRE_PRINCIPAL';

  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    libelle: dto.libelle ?? '',
    nature,
    uniteOeuvre: dto.uniteOeuvreCode ?? '',
    axeId: dto.id ?? '',
    actif: dto.actif ?? true,
    responsable: dto.responsable,
    budgetAlloue: dto.budgetAnnuel,
  };
}

export function mapCentreUiToDto(data: Partial<CentreAnalyse>): AxeAnalytiqueDto {
  const typeCentre =
    data.nature === 'CENTRE_AUXILIAIRE'
      ? 'AUXILIAIRE'
      : 'PRINCIPAL';

  return {
    id: data.id && UUID_PATTERN.test(data.id) ? data.id : undefined,
    code: data.code?.trim() || buildCodeFromLibelle(data.libelle ?? 'CENTRE', 'CTR'),
    libelle: data.libelle?.trim() ?? '',
    type: 'CENTRE_COUT',
    typeCentre,
    responsable: data.responsable,
    budgetAnnuel: data.budgetAlloue,
    uniteOeuvreCode: data.uniteOeuvre || undefined,
    actif: data.actif ?? true,
  };
}

export function mapUniteDtoToUi(dto: UniteOeuvreDto): UniteOeuvre {
  const uniteMesure = UNITE_FROM_API[dto.unite ?? ''] ?? dto.unite?.toLowerCase() ?? '';
  const isMonetaire = dto.unite === 'HEURE_MOD';

  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    libelle: dto.libelle ?? '',
    nature: isMonetaire ? 'MONETAIRE' : 'PHYSIQUE',
    uniteMesure,
    centresLies: dto.centreId ? [dto.centreId] : [],
    hasCalculs: Boolean(dto.coutUnitairePrevisionnel),
    volumePrevuPeriode: dto.coutUnitairePrevisionnel,
  };
}

export function mapUniteUiToDto(data: Partial<UniteOeuvre>): UniteOeuvreDto {
  const uniteKey = (data.uniteMesure ?? data.code ?? '').toLowerCase();
  const apiUnite = UNITE_TO_API[uniteKey] ?? (data.nature === 'MONETAIRE' ? 'HEURE_MOD' : 'HEURE_MACHINE');

  return {
    id: data.id && UUID_PATTERN.test(data.id) ? data.id : undefined,
    code: data.code?.trim() || buildCodeFromLibelle(data.libelle ?? 'UO', 'UO'),
    libelle: data.libelle?.trim() ?? '',
    unite: apiUnite,
    centreId: data.centresLies?.[0],
    coutUnitairePrevisionnel: data.volumePrevuPeriode,
    actif: true,
  };
}

export function mapJournalDtoToUi(dto: JournalAnalytiqueDto): JournalAnalytiqueConfig {
  const type = JOURNAL_TYPE_FROM_API[dto.type ?? ''] ?? 'OPERATIONS_DIRECTES';
  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    libelle: dto.libelle ?? '',
    type,
    exigenceCentreSource: type === 'VIREMENTS_RECLASSEMENTS' ? 'OBLIGATOIRE' : 'DESACTIVEE',
    actif: dto.actif ?? true,
  };
}

export function mapJournalUiToDto(data: Partial<JournalAnalytiqueConfig>): JournalAnalytiqueDto {
  const type = data.type ?? 'OPERATIONS_DIRECTES';
  return {
    id: data.id && UUID_PATTERN.test(data.id) ? data.id : undefined,
    code: data.code?.trim() || buildCodeFromLibelle(data.libelle ?? 'JAL', 'JAL'),
    libelle: data.libelle?.trim() ?? '',
    type: JOURNAL_TYPE_TO_API[type],
    actif: data.actif ?? true,
  };
}

export function mapStatutApiToUi(statut?: string): StatutPeriode {
  if (statut === 'CLOTUREE') return 'CLOTURE';
  return 'OUVERT';
}

export function mapStatutUiToApi(statut: StatutPeriode): string {
  if (statut === 'CLOTURE') return 'CLOTUREE';
  return 'OUVERTE';
}

export function mapPeriodeCGToDto(cg: PeriodeCG, statut: StatutPeriode = 'OUVERT'): PeriodeAnalytiqueDto {
  return {
    exerciceId: cg.exerciceCGId,
    code: cg.code,
    libelle: cg.libelle,
    dateDebut: cg.dateDebut,
    dateFin: cg.dateFin,
    statut: mapStatutUiToApi(statut),
  };
}

export function mapPeriodeDtoToStatutOverrides(
  dtos: PeriodeAnalytiqueDto[],
): Record<string, StatutPeriode> {
  const overrides: Record<string, StatutPeriode> = {};
  for (const dto of dtos) {
    if (!dto.id) continue;
    overrides[dto.id] = mapStatutApiToUi(dto.statut);
  }
  return overrides;
}

export function inferNatureUOFromUnite(unite?: string): NatureUO {
  return unite === 'HEURE_MOD' ? 'MONETAIRE' : 'PHYSIQUE';
}
