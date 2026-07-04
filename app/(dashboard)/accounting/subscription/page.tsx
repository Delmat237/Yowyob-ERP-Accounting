"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, PieChart, Loader2, Save } from "lucide-react";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAccountingSubscription } from "@/hooks/use-accounting-subscription";
import { useAuth } from "@/hooks/use-auth";
import { GENERALE_DASHBOARD_PATH } from "@/lib/accounting-dashboard-routes";

/**
 * Gestion de l'abonnement de l'organisation aux activités comptables
 * (Comptabilité Générale / Analytique). Réservé au responsable comptable :
 * la modification appelle PUT /api/accounting/subscriptions (SUPERVISE côté backend).
 * Les modules désactivés disparaissent de la barre latérale.
 */
export default function AccountingSubscriptionPage() {
    const router = useRouter();
    const { generale, analytique, loaded, loading, load, update } = useAccountingSubscription();
    const { accountingRole } = useAuth();
    const canManage = accountingRole === "RESPONSABLE_COMPTABLE";

    const [localGenerale, setLocalGenerale] = useState(generale);
    const [localAnalytique, setLocalAnalytique] = useState(analytique);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        load();
    }, [load]);

    // Synchronise l'état local une fois l'abonnement chargé.
    useEffect(() => {
        if (loaded) {
            setLocalGenerale(generale);
            setLocalAnalytique(analytique);
        }
    }, [loaded, generale, analytique]);

    const dirty = localGenerale !== generale || localAnalytique !== analytique;

    const handleSave = async () => {
        if (!localGenerale && !localAnalytique) {
            toast.error("Au moins une activité comptable doit rester active.");
            return;
        }
        setIsSaving(true);
        try {
            const hadAnalytique = analytique;
            await update(localGenerale, localAnalytique);
            if (hadAnalytique && !localAnalytique) {
                router.replace(GENERALE_DASHBOARD_PATH);
            }
            toast.success("Abonnement mis à jour. La barre latérale reflète les activités actives.");
        } catch {
            toast.error("Échec de la mise à jour de l'abonnement.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading && !loaded) {
        return <CustomPageLoader message="Chargement de l'abonnement..." />;
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Activités comptables</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Choisissez les activités auxquelles votre organisation est abonnée. Désactiver
                        la comptabilité analytique retire l&apos;accès à ce module pour tous les utilisateurs.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={handleSave} disabled={isSaving || !dirty} className="gap-2">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Enregistrer
                    </Button>
                )}
            </div>

            {!canManage && (
                <p className="text-sm rounded-md bg-amber-50 text-amber-700 px-3 py-2 border border-amber-200">
                    Seul le responsable comptable peut modifier l'abonnement. Affichage en lecture seule.
                </p>
            )}

            <div className="grid gap-4">
                <ActivityCard
                    icon={BookOpen}
                    title="Comptabilité Générale"
                    description="Plan comptable, écritures, journaux et validation des opérations."
                    accent="from-blue-600 to-indigo-600"
                    checked={localGenerale}
                    disabled={!canManage}
                    onChange={setLocalGenerale}
                />
                <ActivityCard
                    icon={PieChart}
                    title="Comptabilité Analytique"
                    description="Axes analytiques, budgets, suivi budgétaire et rapports de gestion."
                    accent="from-indigo-600 to-violet-600"
                    checked={localAnalytique}
                    disabled={!canManage}
                    onChange={setLocalAnalytique}
                />
            </div>
        </div>
    );
}

function ActivityCard({
    icon: Icon,
    title,
    description,
    accent,
    checked,
    disabled,
    onChange,
}: {
    icon: typeof BookOpen;
    title: string;
    description: string;
    accent: string;
    checked: boolean;
    disabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                    <Switch
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={onChange}
                        title="Activer/Désactiver cette activité"
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        checked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                >
                    {checked ? "Active" : "Inactive"}
                </span>
            </CardContent>
        </Card>
    );
}
