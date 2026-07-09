/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DetailEcritureDto } from './DetailEcritureDto';
import type { JsonNode } from './JsonNode';
export type EcritureComptableDto = {
    id?: string;
    /** Identifiant stable généré côté client (sync offline). */
    clientId?: string;
    libelle: string;
    validee?: boolean;
    statut?: string;
    actif?: boolean;
    notes?: string;
    numeroEcriture?: string;
    dateEcriture: string;
    journalComptableId: string;
    journalComptableLibelle?: string;
    periodeComptableId: string;
    periodeComptableCode?: string;
    montantTotalDebit: number;
    montantTotalCredit: number;
    dateValidation?: string;
    validatedBy?: string;
    referenceExterne?: string;
    attachmentIds?: JsonNode;
    detailsEcriture?: Array<DetailEcritureDto>;
    createdAt?: string;
    updatedAt?: string;
};

