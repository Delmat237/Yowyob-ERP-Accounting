"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CentreAnalyse,
  TypeCentre,
  mockComptesAnalytiques,
  mockUnitesOeuvre,
  TypeAxe,
} from "@/lib/analytique/mock-data";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";
import { formatDateDisplay } from "@/lib/utils";
import { usePeriodesAnalytiquesAlignees } from "@/hooks/use-periodes-analytiques-alignees";
import { useAxesAnalytiques } from "@/hooks/use-axes-analytiques";
import {
  getExerciceAnalytiqueOuvert,
  getPeriodeAnalytiqueEnCours,
  isPeriodeAnalytiqueOuverte,
} from "@/lib/analytique/periodes-alignees";
import { AlertCircle, Link2, Loader2 } from "lucide-react";

const NATURE_LABELS: Record<TypeCentre, string> = {
  CENTRE_TRAVAIL: "Travail",
  CENTRE_RESPONSABILITE: "Responsabilité",
  CENTRE_PROFITS: "Profits",
  CENTRE_RENTABILITE: "Rentabilité",
  CENTRE_AUXILIAIRE: "Auxiliaire",
  CENTRE_PRINCIPAL: "Principal",
};

const TYPE_AXE_LABELS: Record<TypeAxe, string> = {
  PRINCIPAL: "Principal",
  AUXILIAIRE: "Auxiliaire",
};

interface CentreAnalytiqueFormProps {
  initial?: Partial<CentreAnalyse>;
  onCancel: () => void;
  onSubmit: (data: Partial<CentreAnalyse>) => void;
}

export function CentreAnalytiqueForm({ initial, onCancel, onSubmit }: CentreAnalytiqueFormProps) {
  const { periodes, exercices, loading: loadingContexte } = usePeriodesAnalytiquesAlignees();
  const { axes, loading: loadingAxes } = useAxesAnalytiques();
  const exerciceOuvert = useMemo(() => getExerciceAnalytiqueOuvert(exercices), [exercices]);
  const periodeEnCours = useMemo(() => getPeriodeAnalytiqueEnCours(periodes), [periodes]);

  const [form, setForm] = useState<Partial<CentreAnalyse>>({
    code: "",
    libelle: "",
    nature: "CENTRE_PRINCIPAL",
    uniteOeuvre: "",
    axeId: "",
    actif: true,
    responsable: "",
    budgetAlloue: 0,
    typePrestation: "INTERNE",
    ...initial,
  });

  useEffect(() => {
    if (!exerciceOuvert?.id || !periodeEnCours?.id) return;
    setForm((prev) => ({
      ...prev,
      exerciceId: exerciceOuvert.id,
      periodeId: periodeEnCours.id,
    }));
  }, [exerciceOuvert?.id, periodeEnCours?.id]);

  const comptes92 = mockComptesAnalytiques.filter((c) => c.classe === "92");
  const contexteValide =
    !!exerciceOuvert &&
    !!periodeEnCours &&
    isPeriodeAnalytiqueOuverte(periodeEnCours);
  const valid =
    !!form.libelle?.trim() &&
    !!form.axeId &&
    !!form.compteAnalytiqueId &&
    !!form.uniteOeuvre &&
    contexteValide &&
    !loadingContexte &&
    !loadingAxes;

  const exerciceLabel = exerciceOuvert
    ? `${exerciceOuvert.code ?? ""} — ${exerciceOuvert.libelle ?? exerciceOuvert.code ?? ""}`
    : "Aucun exercice ouvert";
  const periodeLabel = periodeEnCours
    ? `${periodeEnCours.libelle} (${formatDateDisplay(periodeEnCours.dateDebut)} → ${formatDateDisplay(periodeEnCours.dateFin)})`
    : "Aucune période ouverte";

  const readonlyFieldClass =
    "mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed";

  return (
    <ComposeFormShell
      onCancel={onCancel}
      onSubmit={() =>
        onSubmit({
          ...form,
          exerciceId: exerciceOuvert?.id,
          periodeId: periodeEnCours?.id,
        })
      }
      submitLabel={initial?.id ? "Enregistrer le centre" : "Créer le centre d'analyse"}
      disabled={!valid}
    >
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
          Contexte comptable (synchronisé CG)
        </h3>
        <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
          <Link2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            L&apos;exercice et la période analytiques reprennent ceux de la comptabilité générale.
            Ils ne se créent pas ici : ouverture et clôture se font uniquement en CG.
          </p>
        </div>
        {loadingContexte ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement du contexte comptable…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Exercice analytique</label>
              <input readOnly disabled className={readonlyFieldClass} value={exerciceLabel} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Période analytique en cours</label>
              <input readOnly disabled className={readonlyFieldClass} value={periodeLabel} />
            </div>
          </div>
        )}
        {!loadingContexte && !contexteValide && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Aucun exercice ou période ouverte en comptabilité générale.
              Ouvrez un exercice et une période en CG avant de créer un centre d&apos;analyse.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
          Identification
        </h3>
        <div>
          <label className="text-sm font-medium text-slate-700">Libellé *</label>
          <input
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.libelle ?? ""}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
            placeholder="Ex: Centre Production"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Axe analytique rattaché *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-60"
            value={form.axeId ?? ""}
            onChange={(e) => setForm({ ...form, axeId: e.target.value })}
            disabled={loadingAxes}
          >
            <option value="">
              {loadingAxes ? "Chargement des axes…" : "-- Sélectionner un axe analytique --"}
            </option>
            {axes.map((axe) => (
              <option key={axe.id} value={axe.id}>
                {axe.code} — {axe.libelle} ({TYPE_AXE_LABELS[axe.type]})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Compte Analytique (Classe 92) *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.compteAnalytiqueId ?? ""}
            onChange={(e) => setForm({ ...form, compteAnalytiqueId: e.target.value })}
          >
            <option value="">-- Sélectionner un compte 92 --</option>
            {comptes92.map((c) => (
              <option key={c.id} value={c.id}>
                {c.numero} - {c.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
          Organisation
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Responsable</label>
            <input
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={form.responsable ?? ""}
              onChange={(e) => setForm({ ...form, responsable: e.target.value })}
              placeholder="Nom du responsable"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Nature *</label>
            <select
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={form.nature ?? "CENTRE_PRINCIPAL"}
              onChange={(e) => setForm({ ...form, nature: e.target.value as TypeCentre })}
            >
              {Object.entries(NATURE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Type de prestation</label>
            <select
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={form.typePrestation ?? "INTERNE"}
              onChange={(e) => setForm({ ...form, typePrestation: e.target.value as CentreAnalyse["typePrestation"] })}
            >
              <option value="INTERNE">Interne</option>
              <option value="EXTERNE">Externe</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Budget alloué (FCFA)</label>
            <input
              type="number"
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={form.budgetAlloue ?? 0}
              onChange={(e) => setForm({ ...form, budgetAlloue: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
          Unité et assiette
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Unité d&apos;œuvre *</label>
            <select
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={form.uniteOeuvre ?? ""}
              onChange={(e) => setForm({ ...form, uniteOeuvre: e.target.value })}
            >
              <option value="" disabled>
                -- Sélectionner une unité --
              </option>
              {mockUnitesOeuvre.map((uo) => (
                <option key={uo.id} value={uo.id}>
                  {uo.libelle} ({uo.uniteMesure})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Assiette de frais</label>
            <input
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={form.assietteFrais ?? ""}
              onChange={(e) => setForm({ ...form, assietteFrais: e.target.value })}
              placeholder="Ex: Montant CG"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="centre-actif"
          checked={form.actif ?? true}
          onChange={(e) => setForm({ ...form, actif: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="centre-actif" className="text-sm font-medium text-slate-700">
          Ce centre est actuellement actif
        </label>
      </div>
    </ComposeFormShell>
  );
}

/** @deprecated Utiliser CentreAnalytiqueForm dans useAnalytiqueCompose */
export const CentreFormModal = CentreAnalytiqueForm;
