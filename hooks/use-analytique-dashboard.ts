"use client";

import { useCallback, useEffect, useState } from "react";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import { AccountingAnalyticsService } from "@/src/lib2/services/AccountingAnalyticsService";
import { AccountingBudgetsService } from "@/src/lib2/services/AccountingBudgetsService";
import { AccountingPeriodsService } from "@/src/lib2/services/AccountingPeriodsService";
import { AccountingFiscalYearsService } from "@/src/lib2/services/AccountingFiscalYearsService";
import type { BudgetDto } from "@/src/lib2/models/BudgetDto";
import type { PeriodeComptableDto } from "@/src/lib2/models/PeriodeComptableDto";
import type { AxeAnalytiqueDto } from "@/src/lib2/models/AxeAnalytiqueDto";
import type { BudgetVsRealiseDto } from "@/src/lib2/models/BudgetVsRealiseDto";
import { AccountingEcrituresAnalytiquesService } from "@/src/lib2/services/AccountingEcrituresAnalytiquesService";

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

const EMPTY: AnalytiqueDashboardState = {
    loading: true,
    partialError: false,
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
    if (p.cloturee) return "CLOTURE";
    const now = new Date();
    const start = new Date(p.dateDebut);
    const end = new Date(p.dateFin);
    if (now >= start && now <= end) return "EN_COURS";
    return "OUVERT";
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

function pickActiveExercice(
    exercices: Array<{ id?: string; libelle?: string; code?: string; date_debut?: string; date_fin?: string; actif?: boolean }>,
) {
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

export function useAnalytiqueDashboard() {
    const [state, setState] = useState<AnalytiqueDashboardState>(EMPTY);

    const load = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) {
            setState((s) => ({ ...s, loading: true }));
        }

        let partialError = false;
        let axes: AxeAnalytiqueDto[] = [];
        let budgets: BudgetDto[] = [];
        let periodes: PeriodeComptableDto[] = [];
        let vsRealise: BudgetVsRealiseDto | null = null;
        let exerciceLibelle: string | null = null;
        let ecrituresValidees = 0;
        let montantEcrituresValidees = 0;

        const [axesRes, budgetsRes, periodesRes, exercicesRes, ecrituresRes] = await Promise.allSettled([
            AccountingAnalyticsService.getAllAxes(),
            AccountingBudgetsService.getAllBudgets(),
            AccountingPeriodsService.getAllPeriodeComptables(),
            AccountingFiscalYearsService.getAllExercices(),
            AccountingEcrituresAnalytiquesService.getAllEcritures(),
        ]);

        if (axesRes.status === "fulfilled") {
            axes = axesRes.value.data ?? [];
        } else {
            partialError = true;
        }

        if (budgetsRes.status === "fulfilled") {
            budgets = budgetsRes.value.data ?? [];
        } else {
            partialError = true;
        }

        if (periodesRes.status === "fulfilled") {
            periodes = periodesRes.value.data ?? [];
        } else {
            partialError = true;
        }

        if (exercicesRes.status === "fulfilled") {
            const active = pickActiveExercice(exercicesRes.value.data ?? []);
            if (active?.id) {
                exerciceLibelle = active.libelle ?? active.code ?? null;
                try {
                    const vsRes = await AccountingBudgetsService.getBudgetVsRealise(active.id);
                    vsRealise = vsRes.data ?? null;
                } catch {
                    partialError = true;
                }
            }
        } else {
            partialError = true;
        }

        if (ecrituresRes.status === "fulfilled") {
            const dtos = ecrituresRes.value.data ?? [];
            ecrituresValidees = dtos.filter((e) => e.statut === "VALIDEE").length;
            montantEcrituresValidees = dtos
                .filter((e) => e.statut === "VALIDEE")
                .reduce((s, e) => s + (e.montantTotal ?? 0), 0);
        } else {
            partialError = true;
        }

        const periodesResume: PeriodeResume[] = periodes.map((p) => ({
            id: p.id ?? p.code,
            libelle: p.code || "Période",
            statut: mapPeriodeStatut(p),
            dateDebut: p.dateDebut,
            dateFin: p.dateFin,
        }));

        const enCours = periodesResume.find((p) => p.statut === "EN_COURS");
        const budgetAlloue = budgets.reduce((s, b) => s + (b.montantAlloue ?? 0), 0);
        const budgetConsomme = budgets.reduce((s, b) => s + (b.montantConsomme ?? 0), 0);

        setState({
            loading: false,
            partialError,
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
            periodesOuvertes: periodesResume.filter((p) => p.statut === "OUVERT").length,
            exerciceLibelle,
            vsRealise,
            ecrituresValidees,
            montantEcrituresValidees,
        });
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useAutoRefresh(load, [load]);

    return { ...state, refresh: load };
}
