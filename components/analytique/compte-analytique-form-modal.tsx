"use client";

import { useState } from "react";
import {
  CompteAnalytique,
  TypeSectionHomogene,
  TYPE_SECTION_LABELS,
} from "@/lib/analytique/mock-data";
import {
  CLASSES_ANALYTIQUES,
  CLASSE_ANALYTIQUE_DESCRIPTIONS,
  CLASSE_ANALYTIQUE_LABELS,
  CLASSE_ANALYTIQUE_NUMERO_EXAMPLES,
  type ClasseAnalytique,
  detectClasseFromNumero,
} from "@/lib/analytique/classes-analytiques";
import { Hash, AlertTriangle, Link2, GitBranch, Loader2 } from "lucide-react";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";
import { useComptesComptablesCG } from "@/hooks/use-comptes-comptables-cg";

const TYPE_SECTION_OPTIONS = Object.entries(TYPE_SECTION_LABELS) as [TypeSectionHomogene, string][];

/** Numéro classe 90 : préfixe 90 + les 4 premiers chiffres du compte CG miroir. */
function buildNumeroFromCGMiroir(noCompte: string): string {
  const digits = noCompte.replace(/\D/g, "");
  return `90${digits.slice(0, 4)}`;
}

interface CompteAnalytiqueFormProps {
  initial?: Partial<CompteAnalytique>;
  onCancel: () => void;
  onSubmit: (data: Partial<CompteAnalytique>) => void;
}

export function CompteAnalytiqueForm({ initial, onCancel, onSubmit }: CompteAnalytiqueFormProps) {
  const { accounts: comptesCG, loading: loadingCG, error: errorCG } = useComptesComptablesCG();

  const [form, setForm] = useState<Partial<CompteAnalytique>>(() => ({
    numero: "",
    libelle: "",
    classe: "92",
    actif: true,
    description: "",
    typeSection: undefined,
    compteCGMiroir: "",
    ...initial,
  }));

  const isEdit = !!initial?.id;
  const classe = form.classe ?? "92";
  const classe90 = classe === "90";
  const classe92 = classe === "92";
  const numeroSuffixe90 = form.numero?.startsWith("90") ? form.numero.slice(2) : "";

  function handleClasseChange(newClasse: ClasseAnalytique) {
    setForm((f) => ({
      ...f,
      classe: newClasse,
      numero: "",
      compteCGMiroir: undefined,
      typeSection: undefined,
    }));
  }

  function handleNumeroChange(val: string) {
    const num = val.replace(/\D/g, "").substring(0, 6);
    const detected = detectClasseFromNumero(num);
    setForm((f) => ({
      ...f,
      numero: num,
      classe: detected ?? f.classe,
      typeSection: (detected ?? f.classe) === "92" ? f.typeSection : undefined,
      compteCGMiroir: detected === "90" ? f.compteCGMiroir : undefined,
    }));
  }

  function handleCompteCGMiroirChange(noCompte: string) {
    if (!noCompte) {
      setForm((f) => ({
        ...f,
        compteCGMiroir: "",
        numero: "",
      }));
      return;
    }
    setForm((f) => ({
      ...f,
      compteCGMiroir: noCompte,
      numero: buildNumeroFromCGMiroir(noCompte),
      classe: "90",
      typeSection: undefined,
    }));
  }

  const numeroMismatch =
    !classe90 &&
    !!form.numero &&
    form.numero.length >= 2 &&
    !form.numero.startsWith(classe);

  const valid =
    !!form.numero &&
    form.numero.length >= 4 &&
    form.numero.startsWith("9") &&
    !!form.libelle?.trim() &&
    !numeroMismatch &&
    (!classe92 || !!form.typeSection) &&
    (!classe90 || !!form.compteCGMiroir?.trim());

  const selectedCG = comptesCG.find((c) => c.noCompte === form.compteCGMiroir);

  return (
    <ComposeFormShell
      onCancel={onCancel}
      onSubmit={() => onSubmit(form)}
      submitLabel={isEdit ? "Enregistrer le compte analytique" : "Créer le compte analytique"}
      disabled={!valid}
    >
      <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800">
        <GitBranch className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Paramétrage opérationnel du compte analytique : liaisons CG, type de section, etc.
          La nomenclature de base se définit dans le <strong>Plan analytique</strong>.
        </p>
      </div>

      {!isEdit ? (
        <div>
          <label className="text-sm font-medium text-slate-700">Classe analytique OHADA *</label>
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
          {CLASSE_ANALYTIQUE_LABELS[classe] ?? "Classe non standard"}
        </div>
      )}

      {classe90 && (
        <div>
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Link2 className="h-4 w-4 text-slate-500" />
            Compte comptable CG miroir *
          </label>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">
            Liaison avec un compte de la comptabilité générale (comptes comptables, classes 6 et 7).
          </p>
          {errorCG && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {errorCG}
            </div>
          )}
          <div className="relative">
            {loadingCG && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            )}
            <select
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none font-mono disabled:opacity-60"
              value={form.compteCGMiroir ?? ""}
              onChange={(e) => handleCompteCGMiroirChange(e.target.value)}
              disabled={isEdit || loadingCG}
            >
              <option value="">
                {loadingCG ? "Chargement des comptes comptables…" : "Sélectionner un compte comptable…"}
              </option>
              {comptesCG.map((c) => (
                <option key={c.id ?? c.noCompte} value={c.noCompte}>
                  {c.noCompte} — {c.libelle}
                </option>
              ))}
            </select>
          </div>
          {selectedCG && (
            <p className="text-xs text-slate-500 mt-1.5">
              Classe {selectedCG.classe ?? selectedCG.noCompte.charAt(0)}
              {selectedCG.typeCompte ? ` · ${selectedCG.typeCompte}` : ""} · {selectedCG.libelle}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Numéro de compte *</label>
        {classe90 ? (
          <div className="mt-1 flex rounded-lg border border-slate-300 overflow-hidden bg-white">
            <div className="flex items-center px-3 py-2 bg-slate-100 border-r border-slate-300 font-mono text-sm font-semibold text-slate-700">
              90
            </div>
            <div className="flex-1 flex items-center px-3 py-2 font-mono text-sm bg-slate-50 text-slate-700 min-h-[38px]">
              {numeroSuffixe90 || (
                <span className="text-slate-400 italic">Sélectionnez un compte CG miroir…</span>
              )}
            </div>
          </div>
        ) : (
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
        )}
        <p className="text-xs text-slate-500 mt-1">
          {classe90
            ? "Le numéro est généré automatiquement à partir du compte CG miroir (90 + 4 premiers chiffres du compte CG)."
            : `Doit commencer par ${classe} et comporter au moins 4 chiffres (classes OHADA 90 à 99).`}
        </p>
        {numeroMismatch && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            Le numéro doit commencer par {classe}. Changez la classe ou corrigez le numéro.
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Libellé du compte *</label>
        <input
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.libelle ?? ""}
          onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          placeholder="Ex: Section - Atelier de Montage"
        />
      </div>

      {classe92 && (
        <div>
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <GitBranch className="h-4 w-4 text-slate-500" />
            Type de section *
          </label>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">
            Détermine l&apos;ordre de répartition dans la méthode des sections homogènes.
          </p>
          <select
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.typeSection ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                typeSection: e.target.value
                  ? (e.target.value as TypeSectionHomogene)
                  : undefined,
              })
            }
          >
            <option value="">Sélectionner un type de section…</option>
            {TYPE_SECTION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Description (optionnel)</label>
        <textarea
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-16"
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Observations complémentaires sur ce compte…"
        />
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
          Compte {form.actif ? "actif" : "inactif"}
        </label>
      </div>
    </ComposeFormShell>
  );
}

/** @deprecated Utiliser CompteAnalytiqueForm dans useAnalytiqueCompose */
export const CompteAnalytiqueFormModal = CompteAnalytiqueForm;
