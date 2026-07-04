"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockGlobalConfig, MethodeStock } from '@/lib/analytique/mock-data';
import {
    getAnalytiqueConfig,
    saveAnalytiqueConfig,
    type AnalytiqueConfig,
} from '@/lib/analytique/analytique-config-store';
import { importFluxDepuisCG } from '@/lib/analytique/import-flux-cg';
import { cn } from '@/lib/utils';
import {
    Settings,
    Coins,
    Binary,
    Lock,
    Clock,
    Save,
    RotateCcw,
    ShieldCheck,
    Database,
    Zap,
    Scale,
    FileClock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigurationPage() {
    const router = useRouter();
    const [config, setConfig] = useState<AnalytiqueConfig>(() => getAnalytiqueConfig());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setConfig(getAnalytiqueConfig());
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        const previous = getAnalytiqueConfig();
        saveAnalytiqueConfig(config);
        const justEnabled =
            config.importComptabiliteGeneraleActive && !previous.importComptabiliteGeneraleActive;

        if (justEnabled) {
            const { created, ignored } = importFluxDepuisCG();
            if (created.length > 0) {
                toast.success(`${created.length} écriture(s) importée(s)`, {
                    description: "Redirection vers la validation…",
                });
                router.push("/analytique/ecritures/validation");
                setIsSaving(false);
                return;
            }
            if (ignored > 0) {
                toast.info("Import activé — aucune nouvelle ligne incorporable.", {
                    description: `${ignored} ligne(s) non incorporable(s) ignorée(s).`,
                });
            }
        }

        setTimeout(() => {
            setIsSaving(false);
            toast.success("Configurations enregistrées avec succès", {
                description: "Les paramètres globaux de l'exercice ont été mis à jour."
            });
        }, 400);
    };

    const handleReset = () => {
        const reset: AnalytiqueConfig = { ...mockGlobalConfig, importComptabiliteGeneraleActive: false };
        setConfig(reset);
    };

    return (
        <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Settings className="h-7 w-7 text-primary" />
                        </div>
                        Paramétrage Global
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Configuration des règles métier, précision monétaire et politiques de clôture.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-secondary transition-colors"
                    >
                        <RotateCcw className="h-4 w-4" /> Réinitialiser
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Zap className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Enregistrer
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold">
                    <FileClock className="h-5 w-5 text-indigo-500" />
                    <h2>Écritures analytiques</h2>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-foreground">Import comptabilité générale</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                                Active l&apos;import des charges incorporables depuis la comptabilité générale.
                                Les écritures importées sont envoyées en validation. La saisie manuelle reste
                                toujours disponible.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={config.importComptabiliteGeneraleActive}
                                onClick={() =>
                                    setConfig({
                                        ...config,
                                        importComptabiliteGeneraleActive: !config.importComptabiliteGeneraleActive,
                                    })
                                }
                                className={cn(
                                    "relative w-11 h-6 rounded-full transition-colors shrink-0",
                                    config.importComptabiliteGeneraleActive ? "bg-indigo-600" : "bg-muted",
                                )}
                            >
                                <span
                                    className={cn(
                                        "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow",
                                        config.importComptabiliteGeneraleActive && "translate-x-5",
                                    )}
                                />
                            </button>
                            <span
                                className={cn(
                                    "text-sm font-medium min-w-[4.5rem]",
                                    config.importComptabiliteGeneraleActive
                                        ? "text-indigo-700"
                                        : "text-muted-foreground",
                                )}
                            >
                                {config.importComptabiliteGeneraleActive ? "Activé" : "Désactivé"}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4 italic">
                        Enregistrez pour appliquer. À la première activation, l&apos;import est lancé automatiquement
                        puis vous êtes redirigé vers la validation.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section Formatage Monétaire */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-foreground font-bold">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <h2>Formatage & Précision</h2>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Devise Pivot</label>
                            <input
                                type="text"
                                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                value={config.devise}
                                onChange={(e) => setConfig({ ...config, devise: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Précision (Décimales)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="0" max="4" step="1"
                                        className="flex-1 accent-primary"
                                        value={config.precision}
                                        onChange={(e) => setConfig({ ...config, precision: parseInt(e.target.value) })}
                                    />
                                    <span className="text-sm font-mono font-bold bg-muted px-3 py-1 rounded-lg border border-border">{config.precision}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Séparateur</label>
                                <select
                                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={config.separateurMilliers}
                                    onChange={(e) => setConfig({ ...config, separateurMilliers: e.target.value })}
                                >
                                    <option value=" ">Espace</option>
                                    <option value=".">Point (.)</option>
                                    <option value=",">Virgule (,)</option>
                                    <option value="">Aucun</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Aperçu</p>
                            <div className="bg-secondary/40 p-4 rounded-xl border border-dashed border-border text-center">
                                <span className="text-2xl font-mono font-bold text-foreground">
                                    {(1234567.8912).toLocaleString('fr-FR', {
                                        minimumFractionDigits: config.precision,
                                        maximumFractionDigits: config.precision
                                    }).replace(/\s/g, config.separateurMilliers)} {config.devise}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-foreground font-bold pt-4">
                        <Database className="h-5 w-5 text-indigo-500" />
                        <h2>Valorisation des Stocks</h2>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                        <div className="grid grid-cols-3 gap-2">
                            {(["CUMP", "FIFO", "LIFO"] as MethodeStock[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setConfig({ ...config, methodeValorisationStocks: m })}
                                    className={`px-3 py-3 rounded-xl border text-[11px] font-bold transition-all ${config.methodeValorisationStocks === m
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/10 shadow-sm"
                                            : "bg-white border-border text-muted-foreground hover:bg-secondary"
                                        }`}
                                >
                                    {m === "CUMP"
                                        ? "Coût unitaire moyen pondéré"
                                        : m === "FIFO"
                                          ? "Premier entré, premier sorti"
                                          : "Dernier entré, premier sorti"}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-3 italic flex gap-2">
                            <Scale className="h-3 w-3" /> Utilisé pour la valorisation des sorties en fin de période analytique.
                        </p>
                    </div>
                </div>

                {/* Section Politique de Clôture */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-foreground font-bold">
                        <Lock className="h-5 w-5 text-rose-500" />
                        <h2>Politiques de Clôture & Saisie</h2>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border hover:bg-secondary/20 transition-colors">
                            <div className="flex-1">
                                <label className="text-sm font-bold text-foreground block">Verrouillage strict comptabilité générale</label>
                                <p className="text-xs text-muted-foreground mt-1">Bloquer automatiquement la saisie dès que la période correspondante de la comptabilité générale est clôturée.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={config.bloquerApresClotureCG}
                                    onChange={(e) => setConfig({ ...config, bloquerApresClotureCG: e.target.checked })} />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                            </label>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Jours de grâce après clôture comptabilité générale</label>
                                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{config.joursGraceCloture} jours</span>
                            </div>
                            <input
                                type="range" min="0" max="30" step="1"
                                className="w-full accent-rose-500"
                                value={config.joursGraceCloture}
                                onChange={(e) => setConfig({ ...config, joursGraceCloture: parseInt(e.target.value) })}
                            />
                            <p className="text-[10px] text-muted-foreground bg-muted/50 p-3 rounded-xl border border-dashed border-border">
                                <Clock className="h-3 w-3 inline mr-1" /> Délai accordé au responsable analytique pour finaliser les ventilations après l&apos;arrêt des comptes en comptabilité générale.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border hover:bg-secondary/20 transition-colors">
                                <div className="flex-1">
                                    <label className="text-sm font-bold text-foreground block">Saisie Rétroactive</label>
                                    <p className="text-xs text-muted-foreground mt-1">Autoriser la modification d&apos;écritures sur une période &quot;En cours&quot; verrouillée manuellement.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={config.autoriserSaisieRetroactive}
                                        onChange={(e) => setConfig({ ...config, autoriserSaisieRetroactive: e.target.checked })} />
                                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-4">
                            <ShieldCheck className="h-6 w-6 text-rose-600 flex-shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-rose-900 uppercase tracking-widest">Alerte Sécurité</p>
                                <p className="text-[11px] text-rose-800">
                                    La modification de ces paramètres a un impact immédiat sur tous les utilisateurs et l&apos;intégrité des données historiques. Ces actions sont tracées dans le journal d&apos;audit système.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
