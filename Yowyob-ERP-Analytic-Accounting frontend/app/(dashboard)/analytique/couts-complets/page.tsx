"use client";

import { useState, useMemo } from "react";
import { mockCoutsProduits, MethodeStock, CoutProduit } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Target, Package, Factory, ShoppingCart, Plus, X } from "lucide-react";

interface MouvementStock {
  id: string;
  date: string;
  libelle: string;
  type: "ENTREE" | "SORTIE";
  quantite: number;
  prixUnitaire: number;
}

interface LigneStock {
  id: string;
  date: string;
  libelle: string;
  entreeQte: number;
  entreePrix: number;
  sortieQte: number;
  sortiePrix: number;
  stockQte: number;
  stockVal: number;
  cump: number;
}

function calculerTableauCUMP(mouvements: MouvementStock[]): LigneStock[] {
  const lignes: LigneStock[] = [];
  let stockQte = 0;
  let stockVal = 0;
  for (const m of mouvements) {
    let cump = stockQte > 0 ? stockVal / stockQte : 0;
    if (m.type === "ENTREE") {
      const newStockVal = stockVal + m.quantite * m.prixUnitaire;
      const newStockQte = stockQte + m.quantite;
      cump = newStockQte > 0 ? newStockVal / newStockQte : m.prixUnitaire;
      stockQte = newStockQte;
      stockVal = newStockVal;
      lignes.push({ id: m.id, date: m.date, libelle: m.libelle, entreeQte: m.quantite, entreePrix: m.prixUnitaire, sortieQte: 0, sortiePrix: 0, stockQte, stockVal, cump });
    } else {
      const sortiePrix = cump;
      const sortieVal = m.quantite * sortiePrix;
      stockQte = Math.max(0, stockQte - m.quantite);
      stockVal = Math.max(0, stockVal - sortieVal);
      lignes.push({ id: m.id, date: m.date, libelle: m.libelle, entreeQte: 0, entreePrix: 0, sortieQte: m.quantite, sortiePrix, stockQte, stockVal, cump });
    }
  }
  return lignes;
}

function calculerTableauFIFO(mouvements: MouvementStock[]): LigneStock[] {
  const lignes: LigneStock[] = [];
  const couches: { qte: number; prix: number }[] = [];
  let stockQte = 0;
  let stockVal = 0;
  for (const m of mouvements) {
    if (m.type === "ENTREE") {
      couches.push({ qte: m.quantite, prix: m.prixUnitaire });
      stockQte += m.quantite;
      stockVal += m.quantite * m.prixUnitaire;
      lignes.push({ id: m.id, date: m.date, libelle: m.libelle, entreeQte: m.quantite, entreePrix: m.prixUnitaire, sortieQte: 0, sortiePrix: 0, stockQte, stockVal, cump: stockQte > 0 ? stockVal / stockQte : 0 });
    } else {
      let qtaRestante = m.quantite;
      let valSortie = 0;
      while (qtaRestante > 0 && couches.length > 0) {
        const couche = couches[0];
        const pris = Math.min(qtaRestante, couche.qte);
        valSortie += pris * couche.prix;
        couche.qte -= pris;
        qtaRestante -= pris;
        if (couche.qte === 0) couches.shift();
      }
      const prixMoyen = m.quantite > 0 ? valSortie / m.quantite : 0;
      stockQte = Math.max(0, stockQte - m.quantite);
      stockVal = Math.max(0, stockVal - valSortie);
      lignes.push({ id: m.id, date: m.date, libelle: m.libelle, entreeQte: 0, entreePrix: 0, sortieQte: m.quantite, sortiePrix: prixMoyen, stockQte, stockVal, cump: stockQte > 0 ? stockVal / stockQte : 0 });
    }
  }
  return lignes;
}

function calculerTableauLIFO(mouvements: MouvementStock[]): LigneStock[] {
  const lignes: LigneStock[] = [];
  const couches: { qte: number; prix: number }[] = [];
  let stockQte = 0;
  let stockVal = 0;
  for (const m of mouvements) {
    if (m.type === "ENTREE") {
      couches.push({ qte: m.quantite, prix: m.prixUnitaire });
      stockQte += m.quantite;
      stockVal += m.quantite * m.prixUnitaire;
      lignes.push({ id: m.id, date: m.date, libelle: m.libelle, entreeQte: m.quantite, entreePrix: m.prixUnitaire, sortieQte: 0, sortiePrix: 0, stockQte, stockVal, cump: stockQte > 0 ? stockVal / stockQte : 0 });
    } else {
      let qtaRestante = m.quantite;
      let valSortie = 0;
      while (qtaRestante > 0 && couches.length > 0) {
        const couche = couches[couches.length - 1];
        const pris = Math.min(qtaRestante, couche.qte);
        valSortie += pris * couche.prix;
        couche.qte -= pris;
        qtaRestante -= pris;
        if (couche.qte === 0) couches.pop();
      }
      const prixMoyen = m.quantite > 0 ? valSortie / m.quantite : 0;
      stockQte = Math.max(0, stockQte - m.quantite);
      stockVal = Math.max(0, stockVal - valSortie);
      lignes.push({ id: m.id, date: m.date, libelle: m.libelle, entreeQte: 0, entreePrix: 0, sortieQte: m.quantite, sortiePrix: prixMoyen, stockQte, stockVal, cump: stockQte > 0 ? stockVal / stockQte : 0 });
    }
  }
  return lignes;
}

function mouvementsInitiaux(p: CoutProduit): MouvementStock[] {
  return [
    { id: `${p.id}-si`, date: "2026-03-01", libelle: "Stock initial", type: "ENTREE", quantite: 100, prixUnitaire: Math.round(p.coutAchat * 0.0075) },
    { id: `${p.id}-a1`, date: "2026-03-08", libelle: "Achat matières premières", type: "ENTREE", quantite: 200, prixUnitaire: Math.round(p.coutAchat * 0.008) },
    { id: `${p.id}-s1`, date: "2026-03-15", libelle: "Consommation production", type: "SORTIE", quantite: 150, prixUnitaire: 0 },
    { id: `${p.id}-a2`, date: "2026-03-22", libelle: "Achat MP complémentaire", type: "ENTREE", quantite: 100, prixUnitaire: Math.round(p.coutAchat * 0.0085) },
  ];
}

const TABS = ["Coût d'achat", "Coût de production", "Coût de revient"] as const;
type TabType = typeof TABS[number];
const FORM_EMPTY = { date: "", libelle: "", type: "ENTREE" as "ENTREE" | "SORTIE", quantite: 0, prixUnitaire: 0 };

export default function CoutsCompletsPage() {
  const [tab, setTab] = useState<TabType>("Coût d'achat");
  const [selectedProduit, setSelectedProduit] = useState<CoutProduit>(mockCoutsProduits[0]);
  const [methode, setMethode] = useState<MethodeStock>(mockCoutsProduits[0].methodeStock);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);

  const [mouvementsMap, setMouvementsMap] = useState<Record<string, MouvementStock[]>>(() => {
    const map: Record<string, MouvementStock[]> = {};
    for (const p of mockCoutsProduits) map[p.id] = mouvementsInitiaux(p);
    return map;
  });

  const mouvements = mouvementsMap[selectedProduit.id] ?? [];

  const tableau = useMemo(() => {
    if (methode === "FIFO") return calculerTableauFIFO(mouvements);
    if (methode === "LIFO") return calculerTableauLIFO(mouvements);
    return calculerTableauCUMP(mouvements);
  }, [mouvements, methode]);

  const dernierLigne = tableau[tableau.length - 1];
  const stockFinalQte = dernierLigne?.stockQte ?? 0;
  const stockFinalVal = dernierLigne?.stockVal ?? 0;
  const totalEntrees = tableau.reduce((s, l) => s + l.entreeQte * l.entreePrix, 0);
  const totalSorties = tableau.reduce((s, l) => s + l.sortieQte * l.sortiePrix, 0);

  const coutAchatComponents = useMemo(() => {
    const base = selectedProduit.coutAchat;
    return [
      { label: "Prix d'achat matières", val: base * 0.75 },
      { label: "Frais de transport", val: base * 0.12 },
      { label: "Centre Approvisionnement", val: base * 0.08 },
      { label: "Frais de réception", val: base * 0.05 },
    ];
  }, [selectedProduit]);

  const coutProdComponents = useMemo(() => {
    const prod = selectedProduit.coutProduction;
    const achat = selectedProduit.coutAchat;
    const mod = prod - achat - prod * 0.18 - prod * 0.04 + prod * 0.02;
    return [
      { label: "Coût d'achat matières consommées", val: achat, pct: achat / prod },
      { label: "Main-d'œuvre directe", val: mod, pct: mod / prod },
      { label: "Centre Production (UO: H.Machine)", val: prod * 0.18, pct: 0.18 },
      { label: "En-cours début de période", val: prod * 0.04, pct: 0.04 },
      { label: "(−) En-cours fin de période", val: -prod * 0.02, pct: -0.02 },
    ];
  }, [selectedProduit]);

  const coutRevComponents = useMemo(() => {
    const rev = selectedProduit.coutRevient;
    const prod = selectedProduit.coutProduction;
    const dist = rev - prod - rev * 0.08 - rev * 0.03;
    return [
      { label: "Coût de production des produits vendus", val: prod },
      { label: "Centre Distribution (UO: Unité vendue)", val: dist },
      { label: "Centre Administration (Assiette CG)", val: rev * 0.08 },
      { label: "Frais emballage", val: rev * 0.03 },
    ];
  }, [selectedProduit]);

  function ajouterMouvement() {
    if (!form.date || !form.libelle || form.quantite <= 0) return;
    const newMvt: MouvementStock = {
      id: `${selectedProduit.id}-${Date.now()}`,
      date: form.date,
      libelle: form.libelle,
      type: form.type,
      quantite: form.quantite,
      prixUnitaire: form.type === "SORTIE" ? 0 : form.prixUnitaire,
    };
    setMouvementsMap((prev) => ({
      ...prev,
      [selectedProduit.id]: [...(prev[selectedProduit.id] ?? []), newMvt].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setForm(FORM_EMPTY);
    setShowModal(false);
  }

  function handleProduitSelect(p: CoutProduit) {
    setSelectedProduit(p);
    setMethode(p.methodeStock);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold">Coûts Complets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Méthode des sections homogènes — Coût d&apos;achat, production et revient (Axe 1)</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {mockCoutsProduits.map((p) => (
          <button key={p.id} onClick={() => handleProduitSelect(p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedProduit.id === p.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border text-muted-foreground hover:bg-secondary"}`}>
            <Package className="h-4 w-4" />{p.produitLibelle}<span className="text-[10px] font-mono opacity-70">{p.methodeStock}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Coût d'achat", val: selectedProduit.coutAchat, icon: ShoppingCart, color: "bg-cyan-100 text-cyan-600", desc: "Matières + frais approv." },
          { label: "Coût de production", val: selectedProduit.coutProduction, icon: Factory, color: "bg-indigo-100 text-indigo-600", desc: "Achat + MOD + frais centres" },
          { label: "Coût de revient", val: selectedProduit.coutRevient, icon: Target, color: "bg-emerald-100 text-emerald-600", desc: "Production + distribution" },
        ].map((c) => (
          <div key={c.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className={`p-2.5 rounded-xl w-fit ${c.color} mb-3`}><c.icon className="h-5 w-5" /></div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(c.val)}</p>
            <p className="text-sm font-semibold text-foreground/80 mt-0.5">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-border gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Coût d'achat" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-3 pb-2 border-b border-border">Fiche de coût d&apos;achat — {selectedProduit.produitLibelle}</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Composante</th><th className="text-right py-1">Montant</th><th className="text-right py-1">%</th></tr></thead>
                <tbody>
                  {coutAchatComponents.map(({ label, val }) => (
                    <tr key={label} className="border-b border-border/30">
                      <td className="py-2 text-muted-foreground">{label}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(val)}</td>
                      <td className="py-2 text-right text-xs text-muted-foreground">{((val / selectedProduit.coutAchat) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="font-bold"><td className="py-2">Coût d&apos;achat total</td><td className="py-2 text-right text-primary">{formatCurrency(selectedProduit.coutAchat)}</td><td className="py-2 text-right text-xs">100%</td></tr>
                </tbody>
              </table>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-3 pb-2 border-b border-border">Méthode de valorisation des stocks</h3>
              <div className="flex gap-2 mb-4">
                {(["CUMP", "FIFO", "LIFO"] as MethodeStock[]).map((m) => (
                  <button key={m} onClick={() => setMethode(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${methode === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-2">
                <p><strong>CUMP :</strong> Coût Unitaire Moyen Pondéré — recalculé après chaque entrée.</p>
                <p><strong>FIFO :</strong> Premier entré, premier sorti — valorise les sorties aux premières entrées.</p>
                <p><strong>LIFO :</strong> Dernier entré, premier sorti — sorties valorisées aux dernières entrées.</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <div className="text-center"><p className="text-xs text-muted-foreground">Total entrées</p><p className="text-sm font-bold text-cyan-700">{formatCurrency(totalEntrees)}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Total sorties</p><p className="text-sm font-bold text-rose-600">{formatCurrency(totalSorties)}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Stock final</p><p className="text-sm font-bold text-emerald-700">{stockFinalQte} u</p><p className="text-xs font-mono text-emerald-600">{formatCurrency(stockFinalVal)}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">Tableau de stock — {selectedProduit.produitLibelle} ({methode})</h3>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" /> Nouveau mouvement
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left">Date</th>
                    <th className="px-4 py-2.5 text-left">Libellé</th>
                    <th className="px-3 py-2.5 text-right">Qté E.</th>
                    <th className="px-3 py-2.5 text-right">Val. E.</th>
                    <th className="px-3 py-2.5 text-right">Qté S.</th>
                    <th className="px-3 py-2.5 text-right">Val. S.</th>
                    <th className="px-3 py-2.5 text-right">Stock Qté</th>
                    <th className="px-3 py-2.5 text-right">Stock Val.</th>
                    {methode === "CUMP" && <th className="px-3 py-2.5 text-right">CUMP</th>}
                  </tr>
                </thead>
                <tbody>
                  {tableau.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">Aucun mouvement. Cliquez sur &ldquo;Nouveau mouvement&rdquo;.</td></tr>
                  )}
                  {tableau.map((r) => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20">
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.date}</td>
                      <td className="px-4 py-2.5">{r.libelle}</td>
                      <td className="px-3 py-2.5 text-right text-cyan-700">{r.entreeQte > 0 ? r.entreeQte : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-cyan-700 font-mono text-xs">{r.entreeQte > 0 ? formatCurrency(r.entreeQte * r.entreePrix) : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-rose-600">{r.sortieQte > 0 ? r.sortieQte : "—"}</td>
                      <td className="px-3 py-2.5 text-right text-rose-600 font-mono text-xs">{r.sortieQte > 0 ? formatCurrency(r.sortieQte * r.sortiePrix) : "—"}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{r.stockQte}</td>
                      <td className="px-3 py-2.5 text-right font-semibold font-mono text-xs">{formatCurrency(r.stockVal)}</td>
                      {methode === "CUMP" && <td className="px-3 py-2.5 text-right font-mono text-xs text-indigo-600">{r.cump > 0 ? formatCurrency(r.cump) : "—"}</td>}
                    </tr>
                  ))}
                </tbody>
                {tableau.length > 0 && (
                  <tfoot className="bg-muted/30 border-t border-border font-bold text-xs">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5">Total / Stock final</td>
                      <td className="px-3 py-2.5 text-right text-cyan-700">{tableau.reduce((s, l) => s + l.entreeQte, 0)}</td>
                      <td className="px-3 py-2.5 text-right text-cyan-700 font-mono">{formatCurrency(totalEntrees)}</td>
                      <td className="px-3 py-2.5 text-right text-rose-600">{tableau.reduce((s, l) => s + l.sortieQte, 0)}</td>
                      <td className="px-3 py-2.5 text-right text-rose-600 font-mono">{formatCurrency(totalSorties)}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-700">{stockFinalQte}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-700 font-mono">{formatCurrency(stockFinalVal)}</td>
                      {methode === "CUMP" && <td />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "Coût de production" && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4 pb-2 border-b border-border">Fiche de coût de production — {selectedProduit.produitLibelle}</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-muted-foreground"><th className="text-left py-1">Composante</th><th className="text-right py-1">Montant</th><th className="text-right py-1">%</th></tr></thead>
            <tbody>
              {coutProdComponents.map(({ label, val, pct }) => (
                <tr key={label} className="border-b border-border/30">
                  <td className="py-2 text-muted-foreground">{label}</td>
                  <td className={`py-2 text-right font-mono ${val < 0 ? "text-rose-600" : ""}`}>{formatCurrency(val)}</td>
                  <td className="py-2 text-right text-xs text-muted-foreground">{(pct * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="font-bold bg-muted/20">
                <td className="py-2.5">Coût de production total</td>
                <td className="py-2.5 text-right text-primary">{formatCurrency(selectedProduit.coutProduction)}</td>
                <td className="py-2.5 text-right text-xs">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "Coût de revient" && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4 pb-2 border-b border-border">Fiche de coût de revient — {selectedProduit.produitLibelle}</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-muted-foreground"><th className="text-left py-1">Composante</th><th className="text-right py-1">Montant</th><th className="text-right py-1">%</th></tr></thead>
            <tbody>
              {coutRevComponents.map(({ label, val }) => (
                <tr key={label} className="border-b border-border/30">
                  <td className="py-2 text-muted-foreground">{label}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(val)}</td>
                  <td className="py-2 text-right text-xs text-muted-foreground">{((val / selectedProduit.coutRevient) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="font-bold bg-primary/5">
                <td className="py-2.5">Coût de revient total</td>
                <td className="py-2.5 text-right text-primary text-lg">{formatCurrency(selectedProduit.coutRevient)}</td>
                <td className="py-2.5 text-right text-xs">100%</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-sm text-emerald-800 font-medium">Résultat analytique estimé</span>
              <p className="text-xs text-emerald-600 mt-0.5">CA estimé ({formatCurrency(selectedProduit.coutRevient * 1.35)}) − Coût de revient</p>
            </div>
            <span className="text-lg font-bold text-emerald-700">{formatCurrency(selectedProduit.coutRevient * 0.35)}</span>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Nouveau mouvement de stock</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-secondary"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <p className="text-xs text-muted-foreground">Produit : <strong className="text-foreground">{selectedProduit.produitLibelle}</strong> · Méthode : <strong>{methode}</strong></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Date *</label>
                <input type="date" className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Libellé *</label>
                <input type="text" placeholder="Ex: Achat matières..." className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" value={form.libelle} onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Type *</label>
                <select className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "ENTREE" | "SORTIE" }))}>
                  <option value="ENTREE">Entrée</option>
                  <option value="SORTIE">Sortie</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Quantité *</label>
                <input type="number" min={1} className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" value={form.quantite || ""} onChange={(e) => setForm((f) => ({ ...f, quantite: Number(e.target.value) }))} />
              </div>
              {form.type === "ENTREE" && (
                <div className="col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Prix unitaire *</label>
                  <input type="number" min={0} className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" value={form.prixUnitaire || ""} onChange={(e) => setForm((f) => ({ ...f, prixUnitaire: Number(e.target.value) }))} />
                </div>
              )}
              {form.type === "SORTIE" && (
                <div className="col-span-2"><p className="text-xs text-muted-foreground italic">Le prix de sortie est calculé automatiquement selon la méthode {methode}.</p></div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary">Annuler</button>
              <button onClick={ajouterMouvement} disabled={!form.date || !form.libelle || form.quantite <= 0 || (form.type === "ENTREE" && form.prixUnitaire <= 0)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
