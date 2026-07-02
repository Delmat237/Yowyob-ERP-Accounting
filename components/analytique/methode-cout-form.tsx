"use client";

import { useState } from "react";
import {
  MethodeCalculCoût,
  MethodeCalculCout,
  mockPlansAnalytiques,
  mockCentres,
} from "@/lib/analytique/mock-data";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";
import { AlertTriangle, Lock } from "lucide-react";

const METHODES: MethodeCalculCout[] = [
  "COUTS_COMPLETS",
  "COUTS_VARIABLES",
  "IMPUTATION_RATIONNELLE",
  "COUTS_DIRECTS",
];

export const METHODE_COUT_CONFIG: Record<
  MethodeCalculCout,
  { label: string; charges: string; resultat: string; color: string }
> = {
  COUTS_COMPLETS: {
    label: "Coûts Complets",
    charges: "Toutes (directes + indirectes)",
    resultat: "Résultat analytique complet",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  COUTS_VARIABLES: {
    label: "Coûts Variables",
    charges: "Charges variables uniquement",
    resultat: "Marge sur coût variable",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  IMPUTATION_RATIONNELLE: {
    label: "Imputation Rationnelle",
    charges: "Variables + fixes × coeff. activité",
    resultat: "Coût rationnel + différence d'imputation",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  COUTS_DIRECTS: {
    label: "Coûts Directs",
    charges: "Charges directement traçables",
    resultat: "Marge sur coût direct",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

interface MethodeCoutFormProps {
  initial?: Partial<MethodeCalculCoût>;
  onCancel: () => void;
  onSubmit: (data: MethodeCalculCoût) => void;
}

export function MethodeCoutForm({ initial, onCancel, onSubmit }: MethodeCoutFormProps) {
  const [form, setForm] = useState<Partial<MethodeCalculCoût>>(() => ({
    planAnalytiqueId: mockPlansAnalytiques[0]?.id ?? "",
    dateApplication: new Date().toISOString().slice(0, 10),
    statut: "ACTIF",
    activitesNormales: [],
    description: "",
    ...initial,
  }));

  const isEdit = !!initial?.id;
  const methode = form.methode;
  const cfg = methode ? METHODE_COUT_CONFIG[methode] : null;
  const isIR = methode === "IMPUTATION_RATIONNELLE";
  const valid = !!form.planAnalytiqueId && !!form.dateApplication && !!form.methode;

  function updateActivite(centreId: string, val: number) {
    setForm((f) => {
      const list = f.activitesNormales ?? [];
      const centre = mockCentres.find((c) => c.id === centreId);
      const exists = list.find((a) => a.centreId === centreId);
      if (exists) {
        return {
          ...f,
          activitesNormales: list.map((a) =>
            a.centreId === centreId ? { ...a, activiteNormale: val } : a,
          ),
        };
      }
      return {
        ...f,
        activitesNormales: [
          ...list,
          {
            centreId,
            centreLibelle: centre?.libelle ?? centreId,
            activiteNormale: val,
            unite: centre?.uniteOeuvre ?? "",
          },
        ],
      };
    });
  }

  function getActivite(centreId: string) {
    return form.activitesNormales?.find((a) => a.centreId === centreId)?.activiteNormale ?? 0;
  }

  const handleSubmit = () => {
    if (!form.methode || !form.planAnalytiqueId || !form.dateApplication) return;

    onSubmit({
      id: form.id ?? `mc-${Date.now()}`,
      methode: form.methode,
      planAnalytiqueId: form.planAnalytiqueId,
      dateApplication: form.dateApplication,
      statut: "ACTIF",
      activitesNormales: form.activitesNormales ?? [],
      description: form.description ?? "",
    });
  };

  return (
    <ComposeFormShell
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Mettre à jour" : "Activer la méthode"}
      disabled={!valid}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Plan analytique *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.planAnalytiqueId ?? ""}
            onChange={(e) => setForm({ ...form, planAnalytiqueId: e.target.value })}
          >
            {mockPlansAnalytiques.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Date d&apos;application *</label>
          <input
            type="date"
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.dateApplication ?? ""}
            onChange={(e) => setForm({ ...form, dateApplication: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Méthode de calcul OHADA/Melyon *
        </label>
        <select
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.methode ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              methode: e.target.value ? (e.target.value as MethodeCalculCout) : undefined,
              activitesNormales:
                e.target.value === "IMPUTATION_RATIONNELLE"
                  ? (form.activitesNormales ?? [])
                  : [],
            })
          }
        >
          <option value="">— Sélectionner une méthode —</option>
          {METHODES.map((m) => (
            <option key={m} value={m}>
              {METHODE_COUT_CONFIG[m].label}
            </option>
          ))}
        </select>
        {cfg && (
          <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-600">
              <span className="font-medium">Charges :</span> {cfg.charges}
            </p>
            <p className="text-xs text-indigo-700">
              <span className="font-medium">Résultat :</span> {cfg.resultat}
            </p>
          </div>
        )}
      </div>

      {isIR && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-emerald-700" />
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              Activités normales par centre
            </p>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {mockCentres
              .filter((c) => c.actif)
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-2 bg-white/50 rounded-lg border border-emerald-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-900 truncate">{c.libelle}</p>
                    <p className="text-[10px] text-emerald-600">Unité : {c.uniteOeuvre}</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    className="w-24 text-xs border border-emerald-200 rounded-lg px-2 py-1.5 bg-white text-right focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
                    value={getActivite(c.id)}
                    onChange={(e) => updateActivite(c.id, Number(e.target.value))}
                  />
                </div>
              ))}
          </div>
          <p className="text-[10px] text-emerald-700 italic">
            Ces valeurs servent de base au calcul du coefficient d&apos;Imputation Rationnelle
            (Activité Réelle / Activité Normale).
          </p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Observations / Note de gestion</label>
        <textarea
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white h-20 resize-none focus:ring-2 focus:ring-blue-500/20 outline-none"
          placeholder="Détaillez les raisons du choix de cette méthode ou les spécificités d'application..."
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {isEdit && (
          <p className="text-[10px] text-amber-600 font-medium mt-2 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Le changement de méthode en cours d&apos;exercice est fortement déconseillé.
          </p>
        )}
      </div>
    </ComposeFormShell>
  );
}
