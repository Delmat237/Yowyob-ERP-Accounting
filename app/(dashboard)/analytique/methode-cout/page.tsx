"use client";

import { useState } from "react";
import {
  mockMethodesCalcul,
  mockPlansAnalytiques,
  MethodeCalculCoût,
  MethodeCalculCout,
} from "@/lib/analytique/mock-data";
import {
  MethodeCoutForm,
  METHODE_COUT_CONFIG,
} from "@/components/analytique/methode-cout-form";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { formatDateDisplay } from "@/lib/utils";
import { Plus, Pencil, AlertTriangle, CheckCircle2, Lock } from "lucide-react";

export default function MethodeCoutPage() {
  const [methodes, setMethodes] = useState<MethodeCalculCoût[]>(mockMethodesCalcul);
  const { openForm, closeForm } = useAnalytiqueCompose();

  function handleSave(data: MethodeCalculCoût) {
    setMethodes((p) => {
      const updated =
        data.statut === "ACTIF"
          ? p.map((m) =>
              m.planAnalytiqueId === data.planAnalytiqueId
                ? { ...m, statut: "ARCHIVE" as const }
                : m,
            )
          : p;

      return updated.find((m) => m.id === data.id)
        ? updated.map((m) => (m.id === data.id ? data : m))
        : [...updated, data];
    });
  }

  function openMethodeCoutForm(initial?: Partial<MethodeCalculCoût>) {
    openForm(
      initial?.id ? "Modifier la configuration" : "Nouvelle méthode de calcul",
      <MethodeCoutForm
        initial={initial}
        onCancel={closeForm}
        onSubmit={(data) => {
          handleSave(data);
          closeForm();
        }}
      />,
    );
  }

  const active = methodes.filter((m) => m.statut === "ACTIF");
  const archived = methodes.filter((m) => m.statut === "ARCHIVE");

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Méthode de Calcul des Coûts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Logique générale de calcul appliquée au module (Paramétrage 7)
          </p>
        </div>
        <button
          onClick={() => openMethodeCoutForm()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nouvelle méthode
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="text-sm font-bold">Comparatif des méthodes disponibles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Méthode", "Charges incorporées", "Résultat calculé"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                Object.entries(METHODE_COUT_CONFIG) as [
                  MethodeCalculCout,
                  (typeof METHODE_COUT_CONFIG)[MethodeCalculCout],
                ][]
              ).map(([key, cfg]) => (
                <tr key={key} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-xl text-xs font-bold border ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{cfg.charges}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cfg.resultat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Méthodes actives ({active.length})
        </h2>
        <div className="space-y-3">
          {active.map((m) => {
            const cfg = METHODE_COUT_CONFIG[m.methode];
            const plan = mockPlansAnalytiques.find((p) => p.id === m.planAnalytiqueId);
            return (
              <div key={m.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-xl text-xs font-bold border ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Plan : {plan?.libelle ?? m.planAnalytiqueId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · Depuis le {formatDateDisplay(m.dateApplication)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                    {m.methode === "IMPUTATION_RATIONNELLE" && m.activitesNormales.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.activitesNormales.map((a) => (
                          <span
                            key={a.centreId}
                            className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs"
                          >
                            <strong>{a.centreLibelle}</strong> — {a.activiteNormale} {a.unite}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openMethodeCoutForm(m)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary flex-shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {archived.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" /> Méthodes archivées ({archived.length})
          </h2>
          <div className="space-y-2">
            {archived.map((m) => {
              const cfg = METHODE_COUT_CONFIG[m.methode];
              return (
                <div
                  key={m.id}
                  className="bg-muted/20 rounded-xl border border-border p-4 flex items-center justify-between opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-xl text-xs font-bold border ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Depuis le {formatDateDisplay(m.dateApplication)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-bold">Règle : une seule méthode active par plan analytique</p>
          <p>
            Le changement de méthode n&apos;est autorisé qu&apos;en début d&apos;exercice. La méthode
            précédente est automatiquement archivée. Suppression impossible — archivage uniquement.
          </p>
        </div>
      </div>
    </div>
  );
}
