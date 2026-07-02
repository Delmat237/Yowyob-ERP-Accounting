"use client";

import { useState } from "react";
import {
  PrixCessionInterne,
  MethodeCession,
  mockCentres,
  mockUnitesOeuvre,
} from "@/lib/analytique/mock-data";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";
import { History } from "lucide-react";

const METHODES: MethodeCession[] = ["COUT_COMPLET", "PRIX_MARCHE", "PRIX_CONVENTIONNEL"];

export const METHODE_CESSION_CONFIG: Record<
  MethodeCession,
  { label: string; desc: string; color: string }
> = {
  COUT_COMPLET: {
    label: "Coût complet",
    desc: "Valorisé au coût complet calculé",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  PRIX_MARCHE: {
    label: "Prix de marché",
    desc: "Référence au prix externe du marché",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  PRIX_CONVENTIONNEL: {
    label: "Prix conventionnel",
    desc: "Tarif fixé par convention interne",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

interface PrixCessionFormProps {
  initial?: Partial<PrixCessionInterne>;
  onCancel: () => void;
  onSubmit: (data: PrixCessionInterne) => void;
}

export function PrixCessionForm({ initial, onCancel, onSubmit }: PrixCessionFormProps) {
  const [form, setForm] = useState<Partial<PrixCessionInterne>>(() => ({
    prixUnitaire: 0,
    dateDebut: new Date().toISOString().slice(0, 10),
    hasImputations: false,
    versions: [],
    ...initial,
  }));

  const isEdit = !!initial?.id;
  const methode = form.methode;
  const cfg = methode ? METHODE_CESSION_CONFIG[methode] : null;
  const priceChanged = isEdit && initial?.prixUnitaire !== form.prixUnitaire;
  const valid =
    !!form.centreCedantId &&
    !!form.centreBeneficiaireId &&
    !!form.prestationLibelle?.trim() &&
    !!form.methode &&
    !!form.uniteId &&
    (form.prixUnitaire ?? 0) > 0 &&
    !!form.dateDebut;

  const handleSubmit = () => {
    if (
      !form.centreCedantId ||
      !form.centreCedantLibelle ||
      !form.centreBeneficiaireId ||
      !form.centreBeneficiaireLibelle ||
      !form.prestationLibelle ||
      !form.methode ||
      !form.uniteId ||
      !form.uniteLibelle ||
      !form.dateDebut ||
      (form.prixUnitaire ?? 0) <= 0
    ) {
      return;
    }

    const newVersions = priceChanged
      ? [
          {
            prixUnitaire: initial!.prixUnitaire!,
            du: initial!.dateDebut!,
            au: new Date().toISOString().slice(0, 10),
            methode: initial!.methode!,
          },
          ...(initial?.versions ?? []),
        ]
      : (form.versions ?? []);

    onSubmit({
      id: form.id ?? `pc-${Date.now()}`,
      centreCedantId: form.centreCedantId,
      centreCedantLibelle: form.centreCedantLibelle,
      centreBeneficiaireId: form.centreBeneficiaireId,
      centreBeneficiaireLibelle: form.centreBeneficiaireLibelle,
      prestationLibelle: form.prestationLibelle,
      methode: form.methode,
      prixUnitaire: form.prixUnitaire!,
      uniteId: form.uniteId,
      uniteLibelle: form.uniteLibelle,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin || undefined,
      hasImputations: form.hasImputations ?? false,
      versions: newVersions,
    });
  };

  return (
    <ComposeFormShell
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Enregistrer" : "Créer le tarif"}
      disabled={!valid}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Centre cédant *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.centreCedantId ?? ""}
            onChange={(e) => {
              const c = mockCentres.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                centreCedantId: e.target.value,
                centreCedantLibelle: c?.libelle,
                centreBeneficiaireId:
                  form.centreBeneficiaireId === e.target.value
                    ? undefined
                    : form.centreBeneficiaireId,
                centreBeneficiaireLibelle:
                  form.centreBeneficiaireId === e.target.value
                    ? undefined
                    : form.centreBeneficiaireLibelle,
              });
            }}
          >
            <option value="">— Sélectionner —</option>
            {mockCentres
              .filter((c) => c.actif)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.libelle}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Centre bénéficiaire *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.centreBeneficiaireId ?? ""}
            onChange={(e) => {
              const c = mockCentres.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                centreBeneficiaireId: e.target.value,
                centreBeneficiaireLibelle: c?.libelle,
              });
            }}
          >
            <option value="">— Sélectionner —</option>
            {mockCentres
              .filter((c) => c.actif && c.id !== form.centreCedantId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.libelle}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Prestation / Produit *</label>
        <input
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          placeholder="Ex: Maintenance machines, Transport…"
          value={form.prestationLibelle ?? ""}
          onChange={(e) => setForm({ ...form, prestationLibelle: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Unité *</label>
          <select
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.uniteId ?? ""}
            onChange={(e) => {
              const u = mockUnitesOeuvre.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                uniteId: e.target.value,
                uniteLibelle: u?.libelle,
              });
            }}
          >
            <option value="">— Sélectionner —</option>
            {mockUnitesOeuvre.map((u) => (
              <option key={u.id} value={u.id}>
                {u.libelle} ({u.uniteMesure})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Prix unitaire (FCFA) *</label>
          <input
            type="number"
            min={0}
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.prixUnitaire ?? ""}
            onChange={(e) =>
              setForm({ ...form, prixUnitaire: e.target.value ? Number(e.target.value) : 0 })
            }
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Méthode de valorisation *</label>
        <select
          className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={form.methode ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              methode: e.target.value ? (e.target.value as MethodeCession) : undefined,
            })
          }
        >
          <option value="">— Sélectionner une méthode —</option>
          {METHODES.map((m) => (
            <option key={m} value={m}>
              {METHODE_CESSION_CONFIG[m].label}
            </option>
          ))}
        </select>
        {cfg && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-600">{cfg.desc}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Date début *</label>
          <input
            type="date"
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.dateDebut ?? ""}
            onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Date fin (optionnel)</label>
          <input
            type="date"
            className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={form.dateFin ?? ""}
            onChange={(e) =>
              setForm({ ...form, dateFin: e.target.value || undefined })
            }
          />
        </div>
      </div>

      {priceChanged && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800 flex gap-2">
          <History className="h-4 w-4 flex-shrink-0" />
          Le changement de prix génèrera une nouvelle version datée dans l&apos;historique.
        </div>
      )}
    </ComposeFormShell>
  );
}
