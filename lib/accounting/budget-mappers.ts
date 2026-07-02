import type { Budget, BudgetItem } from '@/components/accounting/budget-list-view';
import type { BudgetDto } from '@/src/lib2/models/BudgetDto';

export function mapBudgetDtoToItem(dto: BudgetDto): BudgetItem {
    return {
        id: dto.id ?? '',
        code: dto.code ?? '',
        nom: dto.nom ?? dto.libelle ?? 'Budget',
        type: (dto.type ?? 'EXERCICE') as BudgetItem['type'],
        statut: (dto.statut ?? 'BROUILLON') as BudgetItem['statut'],
        montantAlloue: dto.montantAlloue ?? 0,
        montantConsomme: dto.montantConsomme ?? 0,
        parentId: dto.parentId,
        parentNom: dto.parentNom,
        exerciceId: dto.exerciceId,
        periodeId: dto.periodeId,
        axeIds: dto.axeIds,
        axeLibelles: dto.axeLibelles,
        dateDebut: dto.dateDebut ?? '',
        dateFin: dto.dateFin ?? '',
        seuilAlerte: dto.seuilAlerte ?? 80,
        compteComptableLines: dto.compteLines?.map((line) => ({
            compteId: line.compteId ?? '',
            compteLibelle: line.libelleCompte ?? line.noCompte ?? '',
            montant: line.montantAlloue ?? 0,
            description: line.description ?? '',
        })),
        responsable: dto.createdBy,
    };
}

export function isBudgetBrouillon(dto: BudgetDto): boolean {
    return (dto.statut ?? 'BROUILLON') === 'BROUILLON';
}

/** Adaptation pour BudgetVsRealiseView (type legacy Budget). */
export function mapBudgetItemsToLegacy(budgets: BudgetItem[]): Budget[] {
    return budgets.map((b) => ({
        id: b.id,
        name: b.nom,
        code: b.code,
        axeAnalytique: b.axeLibelles || b.type,
        montantAlloue: b.montantAlloue,
        montantConsomme: b.montantConsomme,
        dateDebut: b.dateDebut,
        dateFin: b.dateFin,
        statut: (b.statut === 'ACTIF' ? 'ACTIF' : b.statut === 'CLOTURE' ? 'CLOTURE' : 'BROUILLON') as Budget['statut'],
    }));
}
