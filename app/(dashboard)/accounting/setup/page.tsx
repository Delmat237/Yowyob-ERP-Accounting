"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Rocket, CheckCircle2, AlertTriangle, Circle, Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    AccountingSetupService,
    type AccountingSetupRequest,
    type AccountingSetupStepResult,
} from "@/src/lib2/services/AccountingSetupService";

type StepKey = "planComptable" | "journaux" | "exercice" | "periodes" | "operations";

const COMPONENTS: { key: StepKey; label: string; description: string }[] = [
    { key: "planComptable", label: "Plan comptable OHADA", description: "Crée le plan de comptes complet (713 comptes OHADA)." },
    { key: "journaux", label: "Journaux comptables", description: "Achats, Ventes, Caisse, Banque, Opérations Diverses." },
    { key: "exercice", label: "Exercice comptable", description: "Crée l'exercice de l'année choisie (01/01 → 31/12)." },
    { key: "periodes", label: "Périodes mensuelles", description: "Les 12 périodes mensuelles de l'exercice." },
    { key: "operations", label: "Comptes essentiels & opérations", description: "Comptes pivots + modèles VENTE / ACHAT / PAIEMENT." },
];

function statusBadge(status?: string) {
    switch (status) {
        case "ALREADY_PRESENT":
            return <Badge className="bg-green-100 text-green-700 border-green-200">Déjà présent</Badge>;
        case "CREATED":
            return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Créé</Badge>;
        case "ERROR":
            return <Badge className="bg-red-100 text-red-700 border-red-200">Erreur</Badge>;
        case "MISSING":
        default:
            return <Badge className="bg-gray-100 text-gray-600 border-gray-200">À initialiser</Badge>;
    }
}

function StepIcon({ status }: { status?: string }) {
    if (status === "ALREADY_PRESENT" || status === "CREATED") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === "ERROR") return <AlertTriangle className="h-5 w-5 text-red-600" />;
    return <Circle className="h-5 w-5 text-gray-300" />;
}

export default function AccountingSetupPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<number>(currentYear);
    const [selections, setSelections] = useState<Record<StepKey, boolean>>({
        planComptable: true,
        journaux: true,
        exercice: true,
        periodes: true,
        operations: true,
    });
    const [statusByKey, setStatusByKey] = useState<Record<string, AccountingSetupStepResult>>({});
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [running, setRunning] = useState(false);

    const fetchStatus = useCallback(async (y: number) => {
        setLoadingStatus(true);
        try {
            const res = await AccountingSetupService.getStatus(y);
            const map: Record<string, AccountingSetupStepResult> = {};
            (res?.data?.steps ?? []).forEach((s) => {
                if (s.key) map[s.key] = s;
            });
            setStatusByKey(map);
        } catch (err: any) {
            const reason = err?.body?.message || err?.message || "Impossible de charger l'état d'initialisation.";
            toast.error(reason);
        } finally {
            setLoadingStatus(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus(year);
    }, [year, fetchStatus]);

    const toggle = (key: StepKey) => setSelections((prev) => ({ ...prev, [key]: !prev[key] }));
    const setAll = (value: boolean) =>
        setSelections({ planComptable: value, journaux: value, exercice: value, periodes: value, operations: value });

    const anySelected = Object.values(selections).some(Boolean);

    const handleRun = async () => {
        if (!anySelected) {
            toast.warning("Sélectionnez au moins un composant à initialiser.");
            return;
        }
        setRunning(true);
        try {
            const body: AccountingSetupRequest = { ...selections, year };
            const res = await AccountingSetupService.runSetup(body);
            const steps = res?.data?.steps ?? [];
            const map: Record<string, AccountingSetupStepResult> = {};
            steps.forEach((s) => {
                if (s.key) map[s.key] = s;
            });
            setStatusByKey((prev) => ({ ...prev, ...map }));

            const errors = steps.filter((s) => s.status === "ERROR");
            if (errors.length > 0) {
                toast.error(`Initialisation terminée avec ${errors.length} erreur(s).`, {
                    description: errors.map((e) => `${e.label}: ${e.detail}`).join(" — "),
                    duration: 8000,
                });
            } else {
                toast.success("Initialisation comptable terminée.", {
                    description: steps.map((s) => `${s.label}: ${s.detail}`).join(" — "),
                    duration: 6000,
                });
            }
            // Refresh the authoritative status from the backend.
            fetchStatus(year);
        } catch (err: any) {
            const reason = err?.body?.message || err?.message || "Échec de l'initialisation.";
            toast.error(reason);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4 bg-gray-100/30">
            <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <Settings2 className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Initialisation comptable</h2>
                            <p className="text-sm text-gray-500 font-medium">
                                Préparez la comptabilité de votre organisation en un clic. Chaque étape est
                                idempotente : vous pouvez relancer sans risque de doublon.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="year" className="text-sm font-medium text-gray-600">Exercice</label>
                        <input
                            id="year"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value) || currentYear)}
                            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold"
                        />
                    </div>
                </div>

                {/* Components */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                    <div className="flex items-center justify-between px-6 py-3">
                        <span className="text-sm font-semibold text-gray-700">Composants à initialiser</span>
                        <div className="flex gap-2">
                            <button onClick={() => setAll(true)} className="text-xs font-medium text-indigo-600 hover:underline">Tout sélectionner</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => setAll(false)} className="text-xs font-medium text-gray-500 hover:underline">Tout désélectionner</button>
                        </div>
                    </div>

                    {COMPONENTS.map((c) => {
                        const st = statusByKey[c.key];
                        return (
                            <div key={c.key} className="flex items-center gap-4 px-6 py-4">
                                <StepIcon status={st?.status} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900">{c.label}</span>
                                        {!loadingStatus && statusBadge(st?.status)}
                                        {st?.detail && <span className="text-xs text-gray-400">({st.detail})</span>}
                                    </div>
                                    <p className="text-sm text-gray-500">{c.description}</p>
                                </div>
                                <Switch checked={selections[c.key]} onCheckedChange={() => toggle(c.key)} />
                            </div>
                        );
                    })}
                </div>

                {/* Action */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">
                        {loadingStatus ? "Chargement de l'état…" : "Lancez l'initialisation pour l'organisation courante."}
                    </p>
                    <Button onClick={handleRun} disabled={running || !anySelected} className="gap-2">
                        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                        {running ? "Initialisation…" : "Lancer l'initialisation"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
