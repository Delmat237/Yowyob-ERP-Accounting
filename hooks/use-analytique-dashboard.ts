"use client";

import { useCallback, useEffect, useState } from "react";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import { AccountingAnalyticsService } from "@/src/lib2/services/AccountingAnalyticsService";
import { AccountingBudgetsService } from "@/src/lib2/services/AccountingBudgetsService";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";
import { AccountingFiscalYearsService } from "@/src/lib2/services/AccountingFiscalYearsService";
import { AccountingEcrituresAnalytiquesService } from "@/src/lib2/services/AccountingEcrituresAnalytiquesService";
import type { BudgetDto } from "@/src/lib2/models/BudgetDto";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import type { AxeAnalytiqueDto } from "@/src/lib2/models/AxeAnalytiqueDto";
import type { BudgetVsRealiseDto } from "@/src/lib2/models/BudgetVsRealiseDto";
import type { ExerciceComptableDto } from "@/src/lib2/models/ExerciceComptableDto";
import { fetchWithOfflineCache } from "@/lib/offline/fetch-with-cache";
import { CA_CACHE_KEYS, CG_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { getCachedList, setCachedList } from "@/lib/offline/list-cache";
import { networkStatus } from "@/lib/offline/network-status";
import {
    deriveStatutPeriodeComptable,
    getPeriodesVisiblesUtilisateur,
} from "@/lib/accounting/periode-utilisateur";
import { libellePeriodeFromCode } from "@/lib/analytique/periodes-alignees";
import { useOnPeriodesChanged } from "@/hooks/use-on-periodes-changed";

export type PeriodeStatut = "CLOTURE" | "EN_COURS" | "OUVERT";

export interface PeriodeResume {
    id: string;
    libelle: string;
    statut: PeriodeStatut;
    dateDebut: string;
    dateFin: string;
}

export interface BudgetAxeChart {
    name: string;
    alloue: number;
    consomme: number;
}

export interface BudgetBarChart {
    name: string;
    budget: number;
    realise: number;
}

export interface BudgetAlerte {
    id: string;
    nom: string;
    type: string;
    taux: number;
    statut: "depassement" | "alerte" | "ok";
    montantAlloue: number;
    montantConsomme: number;
}

export interface AnalytiqueDashboardState {
    loading: boolean;
    partialError: boolean;
    usingCache: boolean;
    cacheTimestamp?: string;
    axesTotal: number;
    axesActifs: number;
    budgets: BudgetDto[];
    budgetsAnnuel: number;
    budgetsMensuel: number;
    budgetsAnalytiques: BudgetDto[];
    budgetAlloue: number;
    budgetConsomme: number;
    budgetTaux: number;
    budgetParAxe: BudgetAxeChart[];
    budgetBarData: BudgetBarChart[];
    alertesBudgets: BudgetAlerte[];
    periodes: PeriodeResume[];
    periodeEnCours: string | null;
    periodesOuvertes: number;
    exerciceLibelle: string | null;
    vsRealise: BudgetVsRealiseDto | null;
    ecrituresValidees: number;
    montantEcrituresValidees: number;
}

type DashboardSnapshot = Omit<AnalytiqueDashboardState, "loading">;

const EMPTY: AnalytiqueDashboardState = {
    loading: true,
    partialError: false,
    usingCache: false,
    axesTotal: 0,
    axesActifs: 0,
    budgets: [],
    budgetsAnnuel: 0,
    budgetsMensuel: 0,
    budgetsAnalytiques: [],
    budgetAlloue: 0,
    budgetConsomme: 0,
    budgetTaux: 0,
    budgetParAxe: [],
    budgetBarData: [],
    alertesBudgets: [],
    periodes: [],
    periodeEnCours: null,
    periodesOuvertes: 0,
    exerciceLibelle: null,
    vsRealise: null,
    ecrituresValidees: 0,
    montantEcrituresValidees: 0,
};

function budgetTauxConsommation(b: BudgetDto): number {
    const alloue = b.montantAlloue ?? 0;
    const consomme = b.montantConsomme ?? 0;
    if (alloue <= 0) return 0;
    return (consomme / alloue) * 100;
}

function buildAlertesBudgets(budgets: BudgetDto[]): BudgetAlerte[] {
    return budgets
        .map((b) => {
            const taux = budgetTauxConsommation(b);
            const seuil = b.seuilAlerte ?? 80;
            const statut: BudgetAlerte["statut"] =
                taux > 100 ? "depassement" : taux >= seuil ? "alerte" : "ok";
            return {
                id: b.id ?? b.code ?? b.nom ?? "",
                nom: b.nom ?? b.libelle ?? b.code ?? "Budget",
                type: b.type ?? "—",
                taux,
                statut,
                montantAlloue: b.montantAlloue ?? 0,
                montantConsomme: b.montantConsomme ?? 0,
            };
        })
        .filter((a) => a.statut !== "ok")
        .sort((a, b) => b.taux - a.taux);
}

function mapPeriodeStatut(p: PeriodeComptableDto): PeriodeStatut {
    return deriveStatutPeriodeComptable(p);
}

function buildBudgetParAxe(budgets: BudgetDto[]): BudgetAxeChart[] {
    const map = new Map<string, BudgetAxeChart>();

    for (const b of budgets) {
        const ids = b.axeIds ?? [];
        const labels = (b.axeLibelles ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        const alloue = b.montantAlloue ?? 0;
        const consomme = b.montantConsomme ?? 0;

        if (ids.length === 0) {
            const key = "Sans axe";
            const cur = map.get(key) ?? { name: key, alloue: 0, consomme: 0 };
            cur.alloue += alloue;
            cur.consomme += consomme;
            map.set(key, cur);
            continue;
        }

        ids.forEach((id, i) => {
            const name = labels[i] ?? id;
            const cur = map.get(name) ?? { name, alloue: 0, consomme: 0 };
            cur.alloue += alloue / ids.length;
            cur.consomme += consomme / ids.length;
            map.set(name, cur);
        });
    }

    return Array.from(map.values()).sort((a, b) => b.alloue - a.alloue);
}

function buildBudgetBarData(budgets: BudgetDto[]): BudgetBarChart[] {
    return budgets
        .map((b) => ({
            name: (b.nom ?? b.libelle ?? b.code ?? "Budget").slice(0, 18),
            budget: b.montantAlloue ?? 0,
            realise: b.montantConsomme ?? 0,
        }))
        .sort((a, b) => b.budget - a.budget)
        .slice(0, 8);
}

function pickActiveExercice(exercices: ExerciceComptableDto[]) {
    const now = new Date();
    return (
        exercices.find((e) => {
            if (!e.date_debut || !e.date_fin) return e.actif;
            const start = new Date(e.date_debut);
            const end = new Date(e.date_fin);
            return now >= start && now <= end;
        }) ??
        exercices.find((e) => e.actif) ??
        exercices[0] ??
        null
    );
}

function buildStateFromData(
    axes: AxeAnalytiqueDto[],
    budgets: BudgetDto[],
    periodes: PeriodeComptableDto[],
    vsRealise: BudgetVsRealiseDto | null,
    exerciceLibelle: string | null,
    ecrituresValidees: number,
    montantEcrituresValidees: number,
    partialError: boolean,
    usingCache: boolean,
    cacheTimestamp?: string,
): AnalytiqueDashboardState {
    const periodesVisibles = getPeriodesVisiblesUtilisateur(periodes);
    const periodesResume: PeriodeResume[] = periodesVisibles.map((p) => ({
        id: p.id ?? p.code,
        libelle: libellePeriodeFromCode(p.code),
        statut: mapPeriodeStatut(p),
        dateDebut: p.dateDebut,
        dateFin: p.dateFin,
    }));

    const enCours = periodesResume.find((p) => p.statut === "EN_COURS")
        ?? periodesResume.find((p) => p.statut !== "CLOTURE");
    const budgetAlloue = budgets.reduce((s, b) => s + (b.montantAlloue ?? 0), 0);
    const budgetConsomme = budgets.reduce((s, b) => s + (b.montantConsomme ?? 0), 0);
    const periodeVisible = periodesVisibles[0];

    return {
        loading: false,
        partialError,
        usingCache,
        cacheTimestamp,
        axesTotal: axes.length,
        axesActifs: axes.filter((a) => a.actif).length,
        budgets,
        budgetsAnnuel: budgets.filter((b) => b.type === "EXERCICE").length,
        budgetsMensuel: budgets.filter((b) => b.type === "PERIODE").length,
        budgetsAnalytiques: budgets.filter((b) => b.type === "ANALYTIQUE" || (b.axeIds?.length ?? 0) > 0),
        budgetAlloue,
        budgetConsomme,
        budgetTaux: budgetAlloue > 0 ? (budgetConsomme / budgetAlloue) * 100 : 0,
        budgetParAxe: buildBudgetParAxe(budgets),
        budgetBarData: buildBudgetBarData(budgets),
        alertesBudgets: buildAlertesBudgets(budgets),
        periodes: periodesResume,
        periodeEnCours: enCours?.libelle ?? null,
        periodesOuvertes: periodeVisible && !periodeVisible.cloturee ? 1 : 0,
        exerciceLibelle,
        vsRealise,
        ecrituresValidees,
        montantEcrituresValidees,
    };
}

export function useAnalytiqueDashboard() {
    const [state, setState] = useState<AnalytiqueDashboardState>(EMPTY);

    const load = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) {
            setState((s) => ({ ...s, loading: true }));
        }

        if (!networkStatus.isOnline()) {
            const cached = await getCachedList<DashboardSnapshot>(CA_CACHE_KEYS.DASHBOARD);
            if (cached) {
                setState({ ...cached.data, loading: false, usingCache: true, cacheTimestamp: cached.cachedAt });
                return;
            }
        }

        let partialError = false;
        let fromCache = false;
        let cachedAt: string | undefined;

        const [axesResult, budgetsResult, periodesResult, exercicesResult] = await Promise.all([
            fetchWithOfflineCache({
                cacheKey: CA_CACHE_KEYS.AXES,
                fetcher: () => AccountingAnalyticsService.getAllAxes(),
                emptyValue: [] as AxeAnalytiqueDto[],
            }),
            fetchWithOfflineCache({
                cacheKey: CA_CACHE_KEYS.BUDGETS,
                fetcher: () => AccountingBudgetsService.getAllBudgets(),
                emptyValue: [] as BudgetDto[],
            }),
            fetchWithOfflineCache({
                cacheKey: CG_CACHE_KEYS.PERIODES,
                fetcher: () => AccountingPeriodsService.getAllPeriodeComptables(),
                emptyValue: [] as PeriodeComptableDto[],
            }),
            fetchWithOfflineCache({
                cacheKey: CG_CACHE_KEYS.EXERCICES,
                fetcher: () => AccountingFiscalYearsService.getAllExercices(),
                emptyValue: [] as ExerciceComptableDto[],
            }),
        ]);

        fromCache =
            axesResult.fromCache ||
            budgetsResult.fromCache ||
            periodesResult.fromCache ||
            exercicesResult.fromCache;
        cachedAt =
            axesResult.cachedAt ??
            budgetsResult.cachedAt ??
            periodesResult.cachedAt ??
            exercicesResult.cachedAt;

        if (
            axesResult.data.length === 0 &&
            budgetsResult.data.length === 0 &&
            periodesResult.data.length === 0 &&
            networkStatus.isOnline()
        ) {
            partialError = true;
        }

        let vsRealise: BudgetVsRealiseDto | null = null;
        let exerciceLibelle: string | null = null;
        let ecrituresValidees = 0;
        let montantEcrituresValidees = 0;

        const active = pickActiveExercice(exercicesResult.data);
        if (active?.id) {
            exerciceLibelle = active.libelle ?? active.code ?? null;
            if (networkStatus.isOnline()) {
                try {
                    const vsRes = await AccountingBudgetsService.getBudgetVsRealise(active.id);
                    vsRealise = vsRes.data ?? null;
                } catch {
                    partialError = true;
                }
            }
        }

        if (networkStatus.isOnline()) {
            try {
                const ecrituresRes = await AccountingEcrituresAnalytiquesService.getAllEcritures();
                const ecrituresDtos = ecrituresRes.data ?? [];
                ecrituresValidees = ecrituresDtos.filter((e) => e.statut === "VALIDEE").length;
                montantEcrituresValidees = ecrituresDtos
                    .filter((e) => e.statut === "VALIDEE")
                    .reduce((s, e) => s + (e.montantTotal ?? 0), 0);
            } catch {
                partialError = true;
            }
        }

        const nextState = buildStateFromData(
            axesResult.data,
            budgetsResult.data,
            periodesResult.data,
            vsRealise,
            exerciceLibelle,
            ecrituresValidees,
            montantEcrituresValidees,
            partialError,
            fromCache,
            cachedAt,
        );

        await setCachedList(CA_CACHE_KEYS.DASHBOARD, {
            ...nextState,
            loading: false,
        } satisfies DashboardSnapshot);

        setState(nextState);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useAutoRefresh(load, [load]);

    useOnPeriodesChanged(() => {
        void load({ silent: true });
    });

    return { ...state, refresh: load };
}
