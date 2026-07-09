"use client";

import {
  RegleValorisationStock,
  MethodeValorisation,
} from "@/lib/analytique/mock-data";
import {
  ValorisationStockForm,
  METHODE_VALORISATION_CONFIG,
} from "@/components/analytique/valorisation-stock-form";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { useReglesValorisationStockApi } from "@/hooks/use-regles-valorisation-stock-api";
import { formatDateDisplay } from "@/lib/utils";
import { Plus, Pencil, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

const METHODES: MethodeValorisation[] = ["CUMP_PERIODE", "CUMP_ENTREE", "FIFO", "LIFO"];

const METHODE_COLORS: Record<MethodeValorisation, string> = {
  CUMP_PERIODE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CUMP_ENTREE: "bg-cyan-50 text-cyan-700 border-cyan-200",
  FIFO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LIFO: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function ValorisationStocksPage() {
  const { regles, loading, saveRegle, error, usingMockFallback } = useReglesValorisationStockApi();
  const { openForm, closeForm } = useAnalytiqueCompose();

  function openValorisationForm(initial?: Partial<RegleValorisationStock>) {
    openForm(
      initial?.id ? "Modifier la règle de valorisation" : "Nouvelle règle de valorisation",
      <ValorisationStockForm
        initial={initial}
        onCancel={closeForm}
        onSubmit={(data) => {
          void saveRegle(data).then(closeForm);
        }}
      />,
    );
  }

  if (loading) return <CustomPageLoader />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {usingMockFallback && error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Valorisation des Stocks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Méthode de calcul du coût des sorties par famille (Paramétrage 6)
          </p>
        </div>
        <button
          onClick={() => openValorisationForm()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nouvelle règle
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METHODES.map((m) => {
          const cfg = METHODE_VALORISATION_CONFIG[m];
          const count = regles.filter((r) => r.methode === m && r.actif).length;
          return (
            <div key={m} className={`rounded-xl border p-4 shadow-sm ${METHODE_COLORS[m]}`}>
              <p className="text-xs font-bold uppercase">{cfg.label}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
              <p className="text-[10px] mt-0.5 opacity-70">famille(s) active(s)</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {regles.map((r) => {
          const cfg = METHODE_VALORISATION_CONFIG[r.methode];
          return (
            <div
              key={r.id}
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="flex items-start justify-between p-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold">{r.familleLibelle}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${METHODE_COLORS[r.methode]}`}
                    >
                      {cfg.label}
                    </span>
                    {r.actif ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-full text-[10px] font-bold">
                        Archivée
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                  {cfg.formula && (
                    <p className="text-[11px] font-mono text-indigo-700 mt-1">{cfg.formula}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    En vigueur depuis le {formatDateDisplay(r.dateApplication)}
                  </p>
                </div>
                <button
                  onClick={() => openValorisationForm(r)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
              </div>
              {r.historique.length > 0 && (
                <div className="border-t border-border px-5 py-3 bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Historique des méthodes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.historique.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-card border border-border rounded-lg text-xs"
                      >
                        <span className="font-semibold">
                          {METHODE_VALORISATION_CONFIG[h.methode].label}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({formatDateDisplay(h.du)} → {formatDateDisplay(h.au)})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-bold">Règles métier</p>
          <p>
            Le changement de méthode de valorisation n&apos;est autorisé qu&apos;en début de
            période. La méthode historique est conservée pour la consultation. Toute modification
            génère une nouvelle version datée dans l&apos;historique.
          </p>
        </div>
      </div>
    </div>
  );
}
