"use client";

import { useState } from "react";
import { ChargeAnalytique, CentreAnalyse } from "@/lib/analytique/mock-data";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";

interface ChargeAnalytiqueFormProps {
  initial?: Partial<ChargeAnalytique>;
  centres: CentreAnalyse[];
  onCancel: () => void;
  onSubmit: (data: Partial<ChargeAnalytique>) => void;
}

export function ChargeAnalytiqueForm({
  initial,
  centres,
  onCancel,
  onSubmit,
}: ChargeAnalytiqueFormProps) {
  const [form, setForm] = useState<Partial<ChargeAnalytique>>({
    nature: "",
    montant: 0,
    type: "DIRECTE",
    incorporable: true,
    centreId: centres[0]?.id || "",
    ...initial,
  });

  const valid = !!form.nature?.trim() && (form.montant ?? 0) > 0 && !!form.centreId;

  return (
    <ComposeFormShell
      onCancel={onCancel}
      onSubmit={() => onSubmit(form)}
      submitLabel={initial?.id ? "Enregistrer la charge" : "Créer la charge"}
      disabled={!valid}
    >
      <div>
        <label className="text-sm font-medium text-slate-700">Nature de la charge *</label>
        <input
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.nature ?? ""}
          onChange={(e) => setForm({ ...form, nature: e.target.value })}
          placeholder="Ex: Matières premières"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Montant (FCFA) *</label>
        <input
          type="number"
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.montant ?? 0}
          onChange={(e) => setForm({ ...form, montant: parseFloat(e.target.value) })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Type *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.type ?? "DIRECTE"}
            onChange={(e) => setForm({ ...form, type: e.target.value as "DIRECTE" | "INDIRECTE" })}
          >
            <option value="DIRECTE">Directe</option>
            <option value="INDIRECTE">Indirecte</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Centre *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.centreId ?? ""}
            onChange={(e) => setForm({ ...form, centreId: e.target.value })}
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
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
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="incorporable" className="text-sm font-medium text-slate-700">
          Incorporable aux coûts
        </label>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white h-16 resize-none focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </ComposeFormShell>
  );
}

/** @deprecated Utiliser ChargeAnalytiqueForm dans useAnalytiqueCompose */
export const ChargeFormModal = ChargeAnalytiqueForm;
