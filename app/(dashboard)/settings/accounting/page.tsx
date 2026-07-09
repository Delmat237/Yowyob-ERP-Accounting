"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountingSettingService, AccountingSettingDto } from "@/src/lib2/services/AccountingSettingService";
import { Loader2, Save } from "lucide-react";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { fetchWithOfflineCache } from "@/lib/offline/fetch-with-cache";
import { SETTINGS_CACHE_KEYS } from "@/lib/offline/cache-keys";
import { OfflineCacheBanner } from "@/components/offline/offline-cache-banner";

const DEFAULT_SETTING_TYPES = ["FACTURE_FOURNISSEUR", "FACTURE_CLIENT", "MOUVEMENT_STOCK", "PAIEMENT"] as const;

function mergeAccountingSettings(data: AccountingSettingDto[]): AccountingSettingDto[] {
    return DEFAULT_SETTING_TYPES.map((type) => {
        const existing = data.find((s) => s.objetType === type);
        return (
            existing || {
                objetType: type,
                modeSaisie: "SEMI_AUTOMATIQUE" as "AUTOMATIQUE" | "SEMI_AUTOMATIQUE",
                actif: true,
            }
        );
    });
}

export default function AccountingSettingsPage() {
    const [settings, setSettings] = useState<AccountingSettingDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [usingCache, setUsingCache] = useState(false);
    const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const result = await fetchWithOfflineCache({
                cacheKey: SETTINGS_CACHE_KEYS.ACCOUNTING,
                fetcher: async () => mergeAccountingSettings(await AccountingSettingService.getAllSettings()),
                emptyValue: mergeAccountingSettings([]),
            });
            setSettings(result.data);
            setUsingCache(result.fromCache);
            setCacheTimestamp(result.cachedAt);
        } catch (error) {
            toast.error("Échec du chargement des paramètres comptables");
        } finally {
            setIsLoading(false);
        }
    };

    const updateSettingField = (index: number, field: keyof AccountingSettingDto, value: any) => {
        const updated = [...settings];
        updated[index] = { ...updated[index], [field]: value };
        setSettings(updated);
    };

    const handleSave = async () => {
        setIsSaving(true);
        let successCount = 0;
        try {
            for (const setting of settings) {
                const res = await AccountingSettingService.updateSetting(setting);
                if (res.success) successCount++;
            }
            toast.success(`${successCount} paramètres mis à jour avec succès.`);
        } catch (error) {
            toast.error("Erreur lors de la sauvegarde d'un ou plusieurs paramètres.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <CustomPageLoader message="Chargement des paramètres comptables..." />;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Paramètres Comptables</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Configurez le comportement de l'ERP pour la génération automatique ou semi-automatique (brouillard) des écritures comptables.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les modifications
                </Button>
            </div>

            <div className="grid gap-6">
                {settings.map((setting, index) => (
                    <Card key={setting.objetType} className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {formatSettingName(setting.objetType)}
                                        <BadgeActive isActive={setting.actif !== false} />
                                    </CardTitle>
                                    <CardDescription>Mode de comptabilisation pour ce type de document.</CardDescription>
                                </div>
                                <Switch
                                    checked={setting.actif !== false}
                                    onCheckedChange={(checked) => updateSettingField(index, "actif", checked)}
                                    title="Activer/Désactiver cette règle"
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Mode Selection */}
                                <div className="space-y-2">
                                    <Label>Mode de Traitement</Label>
                                    <Select
                                        disabled={setting.actif === false}
                                        value={setting.modeSaisie}
                                        onValueChange={(val) => updateSettingField(index, "modeSaisie", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez le mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AUTOMATIQUE">
                                                <div className="flex flex-col">
                                                    <span>Automatique</span>
                                                    <span className="text-[10px] text-muted-foreground">Création directe d'écriture</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="SEMI_AUTOMATIQUE">
                                                <div className="flex flex-col">
                                                    <span>Semi-Automatique (Brouillard)</span>
                                                    <span className="text-[10px] text-muted-foreground">Passe par une validation manuelle</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Threshold */}
                                <div className="space-y-2">
                                    <Label>Seuil de passage en Brouillard (Optionnel)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Ex: 500000"
                                            disabled={setting.actif === false || setting.modeSaisie === "AUTOMATIQUE"}
                                            value={setting.montantSeuil || ''}
                                            onChange={(e) => updateSettingField(index, "montantSeuil", e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                        <span className="text-sm font-medium text-gray-500">FCFA</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                        Si le montant dépasse ce seuil, une écriture paramétrée en "Automatique" passera tout de même en brouillard pour vérification.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function formatSettingName(type: string) {
    switch (type) {
        case 'FACTURE_FOURNISSEUR': return 'Factures Fournisseurs (Achats)';
        case 'FACTURE_CLIENT': return 'Factures Clients (Ventes)';
        case 'MOUVEMENT_STOCK': return 'Mouvements de Stock';
        case 'PAIEMENT': return 'Paiements / Règlements';
        default: return type.replace(/_/g, ' ');
    }
}

function BadgeActive({ isActive }: { isActive: boolean }) {
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isActive ? 'Actif' : 'Inactif'}
        </span>
    );
}
