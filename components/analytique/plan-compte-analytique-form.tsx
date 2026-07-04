"use client";

import { useState } from "react";
import { CompteAnalytique } from "@/lib/analytique/mock-data";
import {
  CLASSES_ANALYTIQUES,
  CLASSE_ANALYTIQUE_DESCRIPTIONS,
  CLASSE_ANALYTIQUE_LABELS,
  CLASSE_ANALYTIQUE_NUMERO_EXAMPLES,
  type ClasseAnalytique,
  detectClasseFromNumero,
} from "@/lib/analytique/classes-analytiques";
import { Hash, AlertTriangle, Library } from "lucide-react";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";

interface PlanCompteAnalytiqueFormProps {
  initial?: Partial<CompteAnalytique>;
  onCancel: () => void;
  onSubmit: (data: Partial<CompteAnalytique>) => void;
}

/**
 * Formulaire de nomenclature — définit un compte dans le plan analytique (structure OHADA).
 * Sans liaison CG miroir ni type de section (réservés au module Comptes analytiques).
 */
export function PlanCompteAnalytiqueForm({
  initial,
  onCancel,
  onSubmit,
}: PlanCompteAnalytiqueFormProps) {
  const [form, setForm] = useState<Partial<CompteAnalytique>>(() => ({
    numero: "",
    libelle: "",
    classe: "92",
    actif: true,
    description: "",
    dateDebut: "",
    dateFin: "",
    ...initial,
  }));

  const isEdit = !!initial?.id;
  const classe = form.classe ?? "92";

  function handleClasseChange(newClasse: ClasseAnalytique) {
    setForm((f) => ({
      ...f,
      classe: newClasse,
      numero: f.numero?.startsWith(newClasse) ? f.numero : "",
    }));
  }

  function handleNumeroChange(val: string) {
    const num = val.replace(/\D/g, "").substring(0, 6);
    const detected = detectClasseFromNumero(num);
    setForm((f) => ({ ...f, numero: num, classe: detected ?? f.classe }));
  }

  const numeroMismatch =
    !!form.numero && form.numero.length >= 2 && !form.numero.startsWith(classe);

  const valid =
    !!form.numero &&
    form.numero.length >= 4 &&
    form.numero.startsWith("9") &&
    !!form.libelle?.trim() &&
    !numeroMismatch;

  return (
    <ComposeFormShell
      onCancel={onCancel}
      onSubmit={() =>
        onSubmit({
          ...form,
          typeSection: undefined,
          compteCGMiroir: undefined,
        })
      }
      submitLabel={isEdit ? "Enregistrer dans le plan" : "Ajouter au plan"}
      disabled={!valid}
    >
      <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
        <Library className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Ce formulaire définit la <strong>nomenclature</strong> du plan analytique (numéro, intitulé,
          validité). Les liaisons comptabilité générale miroir et types de section se configurent dans{" "}
          <strong>Comptes analytiques</strong>.
        </p>
      </div>

      {!isEdit ? (
        <div>
          <label className="text-sm font-medium text-slate-700">Classe OHADA *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={classe}
            onChange={(e) => handleClasseChange(e.target.value as ClasseAnalytique)}
          >
            {CLASSES_ANALYTIQUES.map((cl) => (
              <option key={cl} value={cl}>
                {CLASSE_ANALYTIQUE_LABELS[cl]}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {CLASSE_ANALYTIQUE_DESCRIPTIONS[classe]}
          </p>
        </div>
      ) : (
        <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          {CLASSE_ANALYTIQUE_LABELS[classe]}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Numéro de compte *</label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Hash className="h-4 w-4 text-slate-400" />
          </div>
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
            value={form.numero ?? ""}
            onChange={(e) => handleNumeroChange(e.target.value)}
            placeholder={CLASSE_ANALYTIQUE_NUMERO_EXAMPLES[classe]}
            disabled={isEdit}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Numéro décimal OHADA (classes 90 à 99), au moins 4 chiffres.
        </p>
        {numeroMismatch && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            Le numéro doit commencer par {classe}.
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Intitulé *</label>
        <input
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.libelle ?? ""}
          onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          placeholder="Ex: Section - Atelier de Montage"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Description (optionnel)</label>
        <textarea
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-16"
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Périmètre couvert par ce compte dans le plan…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Début de validité</label>
          <input
            type="date"
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.dateDebut ?? ""}
            onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Fin de validité</label>
          <input
            type="date"
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.dateFin ?? ""}
            onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm({ ...form, actif: !form.actif })}
          className={`relative w-10 h-5 rounded-full transition-colors ${form.actif ? "bg-blue-600" : "bg-slate-300"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.actif ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
        <label className="text-sm font-medium text-slate-700">
          Compte {form.actif ? "actif" : "inactif"} dans le plan
        </label>
      </div>
    </ComposeFormShell>
  );
}
