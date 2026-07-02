"use client";

import { useState } from "react";
import { RegleValorisationStock, MethodeValorisation } from "@/lib/analytique/mock-data";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";

const METHODES: MethodeValorisation[] = ["CUMP_PERIODE", "CUMP_ENTREE", "FIFO", "LIFO"];

export const METHODE_VALORISATION_CONFIG: Record<
  MethodeValorisation,
  { label: string; desc: string; formula?: string }
> = {
  CUMP_PERIODE: {
    label: "CMUP Période",
    desc: "Taux moyen calculé en fin de période (stock initial + mouvements de la période).",
    formula:
      "CMUP = (Valeur du SI + Valeur des entrées) / (Quantité du SI + Quantité des entrées)",
  },
  CUMP_ENTREE: {
    label: "CMUP / Entrée",
    desc: "Recalculé après chaque entrée — plus précis pour le suivi en continu.",
  },
  FIFO: {
    label: "FIFO (PEPS)",
    desc: "Premières entrées sortent en premier — stock final au coût le plus récent.",
  },
  LIFO: {
    label: "LIFO (DEPS)",
    desc: "Dernières entrées sortent en premier — pénalise le résultat en inflation.",
  },
};

interface ValorisationStockFormProps {
  initial?: Partial<RegleValorisationStock>;
  onCancel: () => void;
  onSubmit: (data: RegleValorisationStock) => void;
}

export function ValorisationStockForm({
  initial,
  onCancel,
  onSubmit,
}: ValorisationStockFormProps) {
  const [form, setForm] = useState<Partial<RegleValorisationStock>>(() => ({
    familleLibelle: "",
    dateApplication: new Date().toISOString().slice(0, 10),
    actif: true,
    historique: [],
    ...initial,
  }));

  const isEdit = !!initial?.id;
  const methode = form.methode;
  const cfg = methode ? METHODE_VALORISATION_CONFIG[methode] : null;
  const valid =
    !!form.familleLibelle?.trim() && !!form.methode && !!form.dateApplication;

  const handleSubmit = () => {
    if (!form.methode || !form.familleLibelle || !form.dateApplication) return;

    const historique =
      isEdit && initial?.methode && initial.methode !== form.methode
        ? [
            {
              methode: initial.methode,
              du: initial.dateApplication!,
              au: new Date().toISOString().slice(0, 10),
            },
            ...(initial.historique ?? []),
          ]
        : (form.historique ?? []);

    onSubmit({
      id: form.id ?? `rvs-${Date.now()}`,
      familleId: form.familleId ?? `fam-${Date.now()}`,
      familleLibelle: form.familleLibelle,
      methode: form.methode,
      dateApplication: form.dateApplication,
      actif: form.actif ?? true,
      historique,
    });
  };

  return (
    <ComposeFormShell
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Enregistrer" : "Créer la règle"}
      disabled={!valid}
    >
      <div>
        <label className="text-sm font-medium text-slate-700">Famille / Article *</label>
        <input
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-60"
          placeholder="Ex: Matières premières"
          value={form.familleLibelle ?? ""}
          onChange={(e) => setForm({ ...form, familleLibelle: e.target.value })}
          disabled={isEdit}
        />
        {isEdit && (
          <p className="text-xs text-slate-500 mt-1">Le périmètre ne peut pas être modifié.</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Méthode de valorisation *</label>
        <select
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.methode ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              methode: e.target.value ? (e.target.value as MethodeValorisation) : undefined,
            })
          }
        >
          <option value="">— Sélectionner une méthode —</option>
          {METHODES.map((m) => (
            <option key={m} value={m}>
              {METHODE_VALORISATION_CONFIG[m].label}
            </option>
          ))}
        </select>
        {cfg && (
          <div className="mt-2 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-600">{cfg.desc}</p>
            {cfg.formula && (
              <p className="text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-1">
                {cfg.formula}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Date d&apos;application *</label>
        <input
          type="date"
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.dateApplication ?? ""}
          onChange={(e) => setForm({ ...form, dateApplication: e.target.value })}
        />
        {isEdit && (
          <p className="text-xs text-amber-600 mt-1">
            Le changement de méthode doit être effectué en début de période.
          </p>
        )}
      </div>
    </ComposeFormShell>
  );
}
