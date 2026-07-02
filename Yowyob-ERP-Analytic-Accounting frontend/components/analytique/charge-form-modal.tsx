"use client";

import { useState } from "react";
import { ChargeAnalytique, CentreAnalyse } from "@/lib/mock-data";
import { FloatingModal } from "@/components/ui/floating-modal";
import { Calculator } from "lucide-react";

interface ChargeFormModalProps {
    initial?: Partial<ChargeAnalytique>;
    centres: CentreAnalyse[];
    onClose: () => void;
    onSave: (data: Partial<ChargeAnalytique>) => void;
}

export function ChargeFormModal({ initial, centres, onClose, onSave }: ChargeFormModalProps) {
    const [form, setForm] = useState<Partial<ChargeAnalytique>>({
        nature: "",
        montant: 0,
        type: "DIRECTE",
        incorporable: true,
        centreId: centres[0]?.id || "",
        ...initial,
    });

    return (
        <FloatingModal
            title={initial?.id ? "Modifier la charge" : "Nouvelle charge analytique"}
            subtitle="Incorporation aux coûts"
            icon={<Calculator className="h-4 w-4" />}
            onClose={onClose}
            accentColor="bg-primary"
            footer={
                <div className="flex justify-end gap-3 px-6 py-4 bg-muted/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => { onSave(form); onClose(); }}
                        className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all active:scale-95 shadow-sm"
                    >
                        {initial?.id ? "Enregistrer" : "Créer la charge"}
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground">Nature de la charge *</label>
                    <input
                        className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                        value={form.nature ?? ""}
                        onChange={(e) => setForm({ ...form, nature: e.target.value })}
                        placeholder="Ex: Matières premières"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground">Montant (FCFA) *</label>
                    <input
                        type="number"
                        className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                        value={form.montant ?? 0}
                        onChange={(e) => setForm({ ...form, montant: parseFloat(e.target.value) })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium text-foreground">Type *</label>
                        <select
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                            value={form.type ?? "DIRECTE"}
                            onChange={(e) => setForm({ ...form, type: e.target.value as "DIRECTE" | "INDIRECTE" })}
                        >
                            <option value="DIRECTE">Directe</option>
                            <option value="INDIRECTE">Indirecte</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground">Centre *</label>
                        <select
                            className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input focus:ring-2 focus:ring-primary/20 outline-none"
                            value={form.centreId ?? ""}
                            onChange={(e) => setForm({ ...form, centreId: e.target.value })}
                        >
                            {centres.map((c) => (
                                <option key={c.id} value={c.id}>{c.libelle}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="incorporable"
                        checked={form.incorporable ?? true}
                        onChange={(e) => setForm({ ...form, incorporable: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="incorporable" className="text-sm font-medium text-foreground">Incorporable aux coûts</label>
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <textarea
                        className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-input h-16 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                        value={form.description ?? ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </div>
            </div>
        </FloatingModal>
    );
}
