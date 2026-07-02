"use client";

import { useState } from "react";
import { CentreAnalyse, TypeCentre, mockComptesAnalytiques, mockUnitesOeuvre } from "@/lib/mock-data";
import { FloatingModal } from "@/components/ui/floating-modal";

const NATURE_LABELS: Record<TypeCentre, string> = {
    CENTRE_TRAVAIL: "Travail",
    CENTRE_RESPONSABILITE: "Responsabilité",
    CENTRE_PROFITS: "Profits",
    CENTRE_RENTABILITE: "Rentabilité",
    CENTRE_AUXILIAIRE: "Auxiliaire",
    CENTRE_PRINCIPAL: "Principal",
};

interface CentreFormModalProps {
    initial?: Partial<CentreAnalyse>;
    onClose: () => void;
    onSave: (data: Partial<CentreAnalyse>) => void;
}

export function CentreFormModal({ initial, onClose, onSave }: CentreFormModalProps) {
    const [form, setForm] = useState<Partial<CentreAnalyse>>({
        code: "",
        libelle: "",
        nature: "CENTRE_PRINCIPAL",
        uniteOeuvre: "",
        actif: true,
        responsable: "",
        budgetAlloue: 0,
        typePrestation: "INTERNE",
        ...initial,
    });

    const comptes92 = mockComptesAnalytiques.filter(c => c.classe === "92");

    return (
        <FloatingModal
            title={initial?.id ? "Modifier le centre" : "Nouveau centre d'analyse"}
            subtitle="Configuration des Centres d'Analyse"
            onClose={onClose}
            accentColor="bg-emerald-600"
            footer={
                <div className="flex justify-end gap-3 px-6 py-4 bg-muted/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors font-medium">Annuler</button>
                    <button
                        onClick={() => { onSave(form); onClose(); }}
                        disabled={!form.libelle || !form.compteAnalytiqueId || !form.uniteOeuvre}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {initial?.id ? "Enregistrer les modifications" : "Créer le centre d'analyse"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {/* Section 1: Identification */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Identification</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Libellé *</label>
                            <input
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.libelle ?? ""}
                                onChange={(e: any) => setForm({ ...form, libelle: e.target.value })}
                                placeholder="Ex: Centre Production"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Compte Analytique (Classe 92) *</label>
                        <select
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                            value={form.compteAnalytiqueId ?? ""}
                            onChange={(e: any) => setForm({ ...form, compteAnalytiqueId: e.target.value })}
                        >
                            <option value="">-- Sélectionner un compte 92 --</option>
                            {comptes92.map((c) => (
                                <option key={c.id} value={c.id}>{c.numero} - {c.libelle}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Section 2: Organisation et Responsabilité */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Organisation</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Responsable</label>
                            <input
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.responsable ?? ""}
                                onChange={(e: any) => setForm({ ...form, responsable: e.target.value })}
                                placeholder="Nom du responsable"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Nature *</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.nature ?? "CENTRE_PRINCIPAL"}
                                onChange={(e: any) => setForm({ ...form, nature: e.target.value as TypeCentre })}
                            >
                                {Object.entries(NATURE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Type de prestation</label>
                            <select
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.typePrestation ?? "INTERNE"}
                                onChange={(e: any) => setForm({ ...form, typePrestation: e.target.value as any })}
                            >
                                <option value="INTERNE">Interne</option>
                                <option value="EXTERNE">Externe</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Budget Alloué (FCFA)</label>
                            <input
                                type="number"
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.budgetAlloue ?? 0}
                                onChange={(e: any) => setForm({ ...form, budgetAlloue: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Mesure */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Unité et Assiette</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Unité d'œuvre *</label>
                            <div className="relative mt-1">
                                <select
                                    className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                    value={form.uniteOeuvre ?? ""}
                                    onChange={(e: any) => setForm({ ...form, uniteOeuvre: e.target.value })}
                                    onClick={(e) => {
                                        // On customise l'UI du select pour forcer la notion de liste scrollable si supporté
                                    }}
                                >
                                    <option value="" disabled>-- Sélectionner une unité --</option>
                                    {mockUnitesOeuvre.map((uo) => (
                                        <option key={uo.id} value={uo.id}>{uo.libelle} ({uo.uniteMesure})</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Assiette de frais</label>
                            <input
                                className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                                value={form.assietteFrais ?? ""}
                                onChange={(e: any) => setForm({ ...form, [form.assietteFrais as any]: e.target.value })}
                                placeholder="Ex: Montant CG"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <input type="checkbox" id="centre-actif" checked={form.actif ?? true}
                        onChange={(e: any) => setForm({ ...form, actif: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="centre-actif" className="text-sm font-medium text-foreground">Ce centre est actuellement actif</label>
                </div>
            </div>
        </FloatingModal>
    );
}
