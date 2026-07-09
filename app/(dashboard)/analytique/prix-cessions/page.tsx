"use client";

import { useState } from "react";
import { PrixCessionInterne } from "@/lib/analytique/mock-data";
import {
  PrixCessionForm,
  METHODE_CESSION_CONFIG,
} from "@/components/analytique/prix-cession-form";
import { useAnalytiqueCompose } from "@/hooks/use-analytique-compose";
import { useCentresAnalyseApi } from "@/hooks/use-centres-analyse-api";
import { useUnitesOeuvreApi } from "@/hooks/use-unites-oeuvre-api";
import { usePrixCessionsApi } from "@/hooks/use-prix-cessions-api";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { Plus, Pencil, Trash2, Clock, AlertCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/analytique/confirm-dialog";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

export default function PrixCessionsPage() {
  const {
    cessions,
    loading: cessionsLoading,
    error: cessionsError,
    usingMockFallback: cessionsMock,
    saveCession,
    removeCession,
  } = usePrixCessionsApi();
  const { openForm, closeForm } = useAnalytiqueCompose();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const {
    centres,
    loading: centresLoading,
    error: centresError,
    usingMockFallback: centresMock,
  } = useCentresAnalyseApi();
  const {
    unites,
    loading: unitesLoading,
    error: unitesError,
    usingMockFallback: unitesMock,
  } = useUnitesOeuvreApi();

  const loading = centresLoading || unitesLoading || cessionsLoading;
  const error = centresError ?? unitesError ?? cessionsError;
  const usingMockFallback = centresMock || unitesMock || cessionsMock;

  async function handleSave(data: PrixCessionInterne) {
    await saveCession(data);
    closeForm();
  }

  function openPrixCessionForm(initial?: Partial<PrixCessionInterne>) {
    openForm(
      initial?.id ? "Modifier le prix de cession" : "Nouveau prix de cession interne",
      <PrixCessionForm
        initial={initial}
        centres={centres}
        unites={unites}
        onCancel={closeForm}
        onSubmit={(data) => {
          void handleSave(data);
        }}
      />,
    );
  }

  if (loading && centres.length === 0 && unites.length === 0 && cessions.length === 0) {
    return <CustomPageLoader message="Chargement des prix de cession..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {deleteId && (
        <ConfirmDialog
          title="Supprimer ce prix de cession ?"
          onClose={() => setDeleteId(null)}
          cancelLabel="Fermer"
          showConfirm={!cessions.find((c) => c.id === deleteId)?.hasImputations}
          onConfirm={() => {
            void removeCession(deleteId).then(() => setDeleteId(null));
          }}
        >
          {cessions.find((c) => c.id === deleteId)?.hasImputations ? (
            <p className="text-sm text-rose-600">
              Impossible — des imputations ont déjà utilisé ce tarif.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          )}
        </ConfirmDialog>
      )}

      {(error || usingMockFallback) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error ??
              (cessionsMock
                ? "Les tarifs sont persistés localement en attendant l'API backend."
                : "Certaines données proviennent du mode démonstration.")}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prix de Cessions Internes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Valorisation des échanges inter-centres (Paramétrage 8)
          </p>
        </div>
        <button
          onClick={() => openPrixCessionForm()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nouveau tarif
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Tarifs actifs",
            val: cessions.filter((c) => !c.dateFin).length,
            color: "text-emerald-700",
          },
          {
            label: "Avec imputations",
            val: cessions.filter((c) => c.hasImputations).length,
            color: "text-amber-600",
          },
          {
            label: "Versions historisées",
            val: cessions.reduce((s, c) => s + c.versions.length, 0),
            color: "text-indigo-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {cessions.map((c) => {
          const cfg = METHODE_CESSION_CONFIG[c.methode];
          const isExpired = c.dateFin && c.dateFin < new Date().toISOString().slice(0, 10);
          return (
            <div
              key={c.id}
              className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${isExpired ? "border-muted opacity-60" : "border-border"}`}
            >
              <div className="flex items-start justify-between p-5 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-foreground">{c.prestationLibelle}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    {isExpired && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-full text-[10px] font-bold">
                        Expiré
                      </span>
                    )}
                    {c.hasImputations && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                        Utilisé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="font-medium text-indigo-700">{c.centreCedantLibelle}</span>
                    <span>→</span>
                    <span className="font-medium text-cyan-700">{c.centreBeneficiaireLibelle}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(c.prixUnitaire)}
                    </span>
                    <span>/{c.uniteLibelle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valide du {formatDateDisplay(c.dateDebut)}
                    {c.dateFin
                      ? ` au ${formatDateDisplay(c.dateFin)}`
                      : " (sans échéance)"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.versions.length > 0 && (
                    <button
                      onClick={() => setShowHistory(showHistory === c.id ? null : c.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary"
                    >
                      <Clock className="h-3.5 w-3.5" /> {c.versions.length} version(s)
                    </button>
                  )}
                  <button
                    onClick={() => openPrixCessionForm(c)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {showHistory === c.id && c.versions.length > 0 && (
                <div className="border-t border-border px-5 py-3 bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Historique des tarifs
                  </p>
                  <div className="space-y-1.5">
                    {c.versions.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-card border border-border rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${METHODE_CESSION_CONFIG[v.methode].color}`}
                          >
                            {METHODE_CESSION_CONFIG[v.methode].label}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDateDisplay(v.du)} → {formatDateDisplay(v.au)}
                          </span>
                        </div>
                        <span className="font-mono font-bold">{formatCurrency(v.prixUnitaire)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-muted/20 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm mb-1">Règles métier</p>
        <p>
          <strong>Historisation automatique :</strong> tout changement de prix génère une nouvelle
          version datée conservée dans l&apos;historique.
        </p>
        <p>
          <strong>Suppression conditionnelle :</strong> impossible si des imputations ont déjà
          utilisé ce tarif.
        </p>
        <p>
          <strong>Unicité :</strong> une seule règle active par couple cédant/bénéficiaire/prestation.
        </p>
      </div>
    </div>
  );
}
