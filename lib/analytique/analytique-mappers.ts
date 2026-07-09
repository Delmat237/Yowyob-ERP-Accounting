import type { CleRepartitionDto } from '@/src/lib2/models/CleRepartitionDto';
import type { CompteAnalytiqueDto } from '@/src/lib2/models/CompteAnalytiqueDto';
import type { AxeAnalytiqueDto } from '@/src/lib2/models/AxeAnalytiqueDto';
import type { EcritureAnalytiqueDto } from '@/src/lib2/models/EcritureAnalytiqueDto';
import type { JournalAnalytiqueDto } from '@/src/lib2/models/JournalAnalytiqueDto';
import type { LigneImputationDto } from '@/src/lib2/models/LigneImputationDto';
import type { PeriodeAnalytiqueDto } from '@/src/lib2/models/PeriodeAnalytiqueDto';
import type { UniteOeuvreDto } from '@/src/lib2/models/UniteOeuvreDto';
import type { ChargeVentileeDto } from '@/src/lib2/models/ChargeVentileeDto';
import type { LigneConcordanceDto } from '@/src/lib2/models/LigneConcordanceDto';
import type { PrixCessionInterneDto } from '@/src/lib2/models/PrixCessionInterneDto';
import type {
  EcritureAnalytique,
  LigneEcritureAnalytique,
  MethodeSaisieEcritures,
  StatutEcritureAnalytique,
} from '@/lib/analytique/ecriture-analytique';
import { buildLignesImputation } from '@/lib/analytique/ecriture-lignes';
import type {
  CentreAnalyse,
  CompteAnalytique,
  ChargeVentilee,
  LigneConcordance,
  MethodeCession,
  NatureUO,
  PeriodeCG,
  StatutPeriode,
  TypeCentre,
  UniteOeuvre,
  PrixCessionInterne,
} from '@/lib/analytique/mock-data';
import type {
  CleRepartitionUi,
  LigneCleRepartition,
  TypeCleRepartition,
} from '@/lib/analytique/cle-repartition';
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

function isUuid(value?: string): boolean {
  return Boolean(value && UUID_PATTERN.test(value));
}

function mapLigneDtoToUi(
  ligne: LigneImputationDto,
  natureChargeId: string,
): LigneEcritureAnalytique {
  const montantBrut = ligne.montant ?? 0;
  const montant =
    ligne.sens === 'CREDIT' ? -Math.abs(montantBrut) : Math.abs(montantBrut);

  return {
    centreId: ligne.centreId ?? '',
    natureChargeId,
    montant,
    libelle: ligne.libelle,
  };
}

function mapLigneUiToDto(ligne: LigneEcritureAnalytique): LigneImputationDto {
  return {
    centreId: isUuid(ligne.centreId) ? ligne.centreId : undefined,
    montant: Math.abs(ligne.montant),
    sens: ligne.montant >= 0 ? 'DEBIT' : 'CREDIT',
    libelle: ligne.libelle,
  };
}

export function mapEcritureDtoToUi(dto: EcritureAnalytiqueDto): EcritureAnalytique {
  const natureChargeId = dto.natureChargeId ?? '';
  const lignes = (dto.lignes ?? []).map((l) => mapLigneDtoToUi(l, natureChargeId));

  const positiveLine = lignes.find((l) => l.montant > 0);
  const negativeLine = lignes.find((l) => l.montant < 0);
  const centreDestinationId =
    positiveLine?.centreId ?? lignes[0]?.centreId ?? '';
  const centreSourceId = negativeLine?.centreId;

  const statut = (dto.statut ?? 'BROUILLON') as StatutEcritureAnalytique;
  const origine = (
    dto.origine === 'IMPORT_CG' ? 'IMPORT_CG' : 'MANUELLE'
  ) as MethodeSaisieEcritures;

  return {
    id: dto.id ?? '',
    statut,
    origine,
    createdAt: dto.validatedAt ?? `${dto.dateEffet}T00:00:00.000Z`,
    validatedAt: dto.validatedAt,
    rejectReason: dto.rejectReason,
    journalId: dto.journalId,
    dateEffet: dto.dateEffet,
    numeroPiece: dto.numeroPiece ?? '',
    libelleOperation: dto.libelle,
    centreSourceId,
    centreDestinationId,
    axeId: centreDestinationId,
    exerciceAnalytiqueId: dto.periodeId ?? '',
    natureChargeId,
    montant: dto.montantTotal ?? 0,
    lignes,
    ligneCGRef: dto.ecriturecgRef,
  };
}

export function mapEcritureUiToDto(
  data: Omit<EcritureAnalytique, 'id' | 'statut' | 'createdAt' | 'validatedAt' | 'rejectReason'> & {
    origine?: MethodeSaisieEcritures;
  },
): EcritureAnalytiqueDto {
  const lignesUi =
    data.lignes?.length > 0
      ? data.lignes
      : buildLignesImputation({
          centreSourceId: data.centreSourceId,
          centreDestinationId: data.centreDestinationId,
          natureChargeId: data.natureChargeId,
          montant: data.montant,
          libelleOperation: data.libelleOperation,
        });

  return {
    journalId: data.journalId,
    periodeId: isUuid(data.exerciceAnalytiqueId) ? data.exerciceAnalytiqueId : undefined,
    numeroPiece: data.numeroPiece,
    libelle: data.libelleOperation,
    dateEffet: data.dateEffet,
    origine: data.origine ?? 'MANUELLE',
    montantTotal: data.montant,
    natureChargeId: isUuid(data.natureChargeId) ? data.natureChargeId : undefined,
    ecriturecgRef: data.ligneCGRef && isUuid(data.ligneCGRef) ? data.ligneCGRef : undefined,
    lignes: lignesUi.map(mapLigneUiToDto),
  };
}

const TYPE_CLE_FROM_API: Record<string, TypeCleRepartition> = {
  FIXE: 'FIXE',
  COUT_UNITAIRE: 'COUT_UNITAIRE',
  UNITE_OEUVRE: 'UNITE_OEUVRE',
};

export function mapCleRepartitionDtoToUi(dto: CleRepartitionDto): CleRepartitionUi {
  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    libelle: dto.libelle ?? '',
    type: TYPE_CLE_FROM_API[dto.type ?? ''] ?? 'FIXE',
    actif: dto.actif ?? true,
    lignes: (dto.lignes ?? []).map((l) => ({
      centreId: l.centreDestinataireId ?? '',
      pourcentage: l.pourcentage ?? 0,
      uniteOeuvreId: l.uniteOeuvreId,
    })),
  };
}

export function mapCleRepartitionUiToDto(data: Partial<CleRepartitionUi>): CleRepartitionDto {
  return {
    id: data.id && UUID_PATTERN.test(data.id) ? data.id : undefined,
    code: data.code?.trim() || buildCodeFromLibelle(data.libelle ?? 'CLE', 'CLE'),
    libelle: data.libelle?.trim() ?? '',
    type: data.type ?? 'FIXE',
    actif: data.actif ?? true,
    lignes: (data.lignes ?? []).map((l: LigneCleRepartition) => ({
      centreDestinataireId: isUuid(l.centreId) ? l.centreId : undefined,
      pourcentage: l.pourcentage,
      uniteOeuvreId: l.uniteOeuvreId && isUuid(l.uniteOeuvreId) ? l.uniteOeuvreId : undefined,
    })),
  };
}

export function mapChargeVentileeDtoToUi(dto: ChargeVentileeDto): ChargeVentilee {
  return {
    id: dto.id ?? '',
    chargeSourceId: dto.chargeSourceId ?? '',
    compteCG: dto.compteCG ?? '',
    libelle: dto.libelle ?? '',
    montantTotal: Number(dto.montantTotal ?? 0),
    incorporable: dto.incorporable ?? true,
    periodeId: dto.periodeId ?? '',
    periodeCGId: dto.periodeCgId ?? dto.periodeId ?? '',
    ventilations: (dto.ventilations ?? []).map((v) => ({
      axeId: v.axeId ?? '',
      centreId: v.centreId ?? '',
      pourcentage: Number(v.pourcentage ?? 0),
    })),
  };
}

export function mapChargeVentileeUiToDto(data: ChargeVentilee): ChargeVentileeDto {
  const ventilations = data.ventilations
    .map((v) => ({
      axeId: isUuid(v.axeId) ? v.axeId : undefined,
      centreId: isUuid(v.centreId) ? v.centreId : undefined,
      pourcentage: v.pourcentage,
    }))
    .filter((v) => v.axeId && v.centreId);

  return {
    id: data.id && isUuid(data.id) ? data.id : undefined,
    chargeSourceId: data.chargeSourceId,
    compteCG: data.compteCG,
    libelle: data.libelle,
    montantTotal: data.montantTotal,
    incorporable: data.incorporable,
    periodeId: isUuid(data.periodeId) ? data.periodeId : undefined,
    periodeCgId: isUuid(data.periodeCGId) ? data.periodeCGId : undefined,
    ventilations,
  };
}

export function mapLigneConcordanceDtoToUi(dto: LigneConcordanceDto): LigneConcordance {
  return {
    id: dto.id ?? '',
    type: dto.type as LigneConcordance['type'],
    label: dto.label ?? '',
    description: dto.description ?? '',
    signe: (dto.signe === '-' ? '-' : '+') as '+' | '-',
    montant: Number(dto.montant ?? 0),
    chargeVentileeId: dto.chargeVentileeId,
  };
}

export function mapLigneConcordanceUiToDto(data: LigneConcordance): LigneConcordanceDto {
  return {
    id: data.id && isUuid(data.id) ? data.id : undefined,
    type: data.type,
    label: data.label,
    description: data.description,
    signe: data.signe,
    montant: data.montant,
    chargeVentileeId:
      data.chargeVentileeId && isUuid(data.chargeVentileeId)
        ? data.chargeVentileeId
        : undefined,
    autoGeneree: false,
  };
}

export function mapLignesConcordanceUiToDto(lignes: LigneConcordance[]): LigneConcordanceDto[] {
  return lignes.map(mapLigneConcordanceUiToDto);
}

export function mapPrixCessionDtoToUi(dto: PrixCessionInterneDto): PrixCessionInterne {
  return {
    id: dto.id ?? '',
    centreCedantId: dto.centreCedantId ?? '',
    centreCedantLibelle: dto.centreCedantLibelle ?? '',
    centreBeneficiaireId: dto.centreBeneficiaireId ?? '',
    centreBeneficiaireLibelle: dto.centreBeneficiaireLibelle ?? '',
    prestationLibelle: dto.prestationLibelle ?? '',
    methode: (dto.methode ?? 'COUT_COMPLET') as MethodeCession,
    prixUnitaire: Number(dto.prixUnitaire ?? 0),
    uniteId: dto.uniteId ?? '',
    uniteLibelle: dto.uniteLibelle ?? '',
    dateDebut: dto.dateDebut ?? '',
    dateFin: dto.dateFin,
    hasImputations: dto.hasImputations ?? false,
    versions: (dto.versions ?? []).map((v) => ({
      prixUnitaire: Number(v.prixUnitaire ?? 0),
      du: v.du ?? '',
      au: v.au ?? '',
      methode: (v.methode ?? 'COUT_COMPLET') as MethodeCession,
    })),
  };
}

export function mapPrixCessionUiToDto(data: PrixCessionInterne): PrixCessionInterneDto {
  return {
    id: data.id && isUuid(data.id) ? data.id : undefined,
    centreCedantId: isUuid(data.centreCedantId) ? data.centreCedantId : undefined,
    centreBeneficiaireId: isUuid(data.centreBeneficiaireId) ? data.centreBeneficiaireId : undefined,
    prestationLibelle: data.prestationLibelle,
    methode: data.methode,
    prixUnitaire: data.prixUnitaire,
    uniteId: isUuid(data.uniteId) ? data.uniteId : undefined,
    dateDebut: data.dateDebut,
    dateFin: data.dateFin,
    hasImputations: data.hasImputations,
  };
}
