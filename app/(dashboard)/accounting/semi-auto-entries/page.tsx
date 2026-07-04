"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import { DraftAccountingService } from '@/src/lib2/services/DraftAccountingService';
import { BrouillardComptableDto } from '@/src/lib2/models/BrouillardComptableDto';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "sonner";
import { CheckCircle2, FileStack, RefreshCw, XCircle, Search, Filter, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDropzone } from 'react-dropzone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGuard } from '@/components/auth/permission-guard';

export default function AccountingSemiAutoEntryPage() {
  const [drafts, setDrafts] = useState<BrouillardComptableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<BrouillardComptableDto | null>(null);

  const fetchDrafts = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    try {
      // Fetch Drafts
      const response = await DraftAccountingService.getAllBrouillards(BrouillardComptableDto.statut.EN_ATTENTE_VALIDATION);
      const draftsDraft = await DraftAccountingService.getAllBrouillards(BrouillardComptableDto.statut.BROUILLON);

      const allDrafts = [...(response || []), ...(draftsDraft || [])].sort(
        (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );

      setDrafts(allDrafts);
      setSelectedDraft(null); // Reset selection on refresh
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
      toast.error("Erreur", { description: "Impossible de charger les brouillards comptables." });
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDrafts();
  }, [fetchDrafts]);

  useAutoRefresh(fetchDrafts, [fetchDrafts]);

  const handleValidate = async () => {
    if (!selectedDraft || !selectedDraft.id) return;

    setIsValidating(true);
    try {
      // Persist any edits (e.g. corrected VAT) before generating the accounting entry,
      // so the écriture reflects the values shown in the preview.
      await DraftAccountingService.updateBrouillard(selectedDraft.id, {
        dataJson: selectedDraft.dataJson,
        montantTotal: selectedDraft.montantTotal,
        libelle: selectedDraft.libelle,
      } as BrouillardComptableDto);

      const response = await DraftAccountingService.validateBrouillard(selectedDraft.id, {
        notes: "Validé depuis l'interface semi-automatique",
        forceValidation: false
      });
      
      if (response && response.success === false) {
        throw new Error(response.message || "Impossible de valider le brouillard.");
      }
      
      toast.success("Succès", { description: "Le brouillard a été validé et l'écriture a été enregistrée." });
      await fetchDrafts(); // Refresh list
    } catch (error: any) {
      console.error("Failed to validate draft:", error);
      toast.error("Erreur de validation", { description: error.message || "Impossible de valider le brouillard." });
    } finally {
      setIsValidating(false);
    }
  };

  // Recompute amounts when the user edits the HT base or the VAT rate, reflecting it
  // live in the preview lines and the list. Persisted on validation (updateBrouillard).
  const applyFinancials = (montantHT: number, tauxTVA: number) => {
    if (!selectedDraft) return;
    const ht = Number.isFinite(montantHT) ? montantHT : 0;
    const taux = Number.isFinite(tauxTVA) ? tauxTVA : 0;
    const tva = Math.round(ht * (taux / 100) * 100) / 100;
    const ttc = Math.round((ht + tva) * 100) / 100;
    const newDataJson = { ...(selectedDraft.dataJson as any), montantHT: ht, montantTVA: tva, montantTTC: ttc, tauxTVA: taux };
    const updated = { ...selectedDraft, dataJson: newDataJson, montantTotal: ttc } as BrouillardComptableDto;
    setSelectedDraft(updated);
    setDrafts(prev => prev.map(d => (d.id === updated.id ? updated : d)));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    const loadingToastId = toast.loading("Analyse du document en cours par l'OCR...");

    try {
      const response = await DraftAccountingService.uploadDraftFromInvoice({ file: file as any });
      if (response && response.success) {
        toast.success("Facture importée", {
          id: loadingToastId,
          description: "Le brouillard comptable a été généré avec succès."
        });
        await fetchDrafts();
      } else {
        throw new Error(response?.message || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("OCR Upload failed:", error);
      toast.error("Échec de l'importation", {
        id: loadingToastId,
        description: error.message || "Impossible de lire la facture."
      });
    } finally {
      setIsUploading(false);
    }
  }, [fetchDrafts]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    multiple: false
  });

  const currentPreviewLines = () => {
    if (!selectedDraft) return [];
    const data = selectedDraft.dataJson;
    let details: Array<{ compte: string, libelle: string, sens: 'D' | 'C', debit: number, credit: number, journal: string }> = [];

    const journalCode = selectedDraft.journalCode || 'JV';

    if (data) {
      if (selectedDraft.type === BrouillardComptableDto.type.FACTURE_FOURNISSEUR) {
        details.push({ compte: '601000', libelle: `Charge (HT) - ${data.numeroFacture || ''}`, sens: 'D', debit: data.montantHT || 0, credit: 0, journal: journalCode });
        if (data.montantTVA && data.montantTVA > 0) {
          details.push({ compte: '445200', libelle: `TVA Déductible`, sens: 'D', debit: data.montantTVA, credit: 0, journal: journalCode });
        }
        details.push({ compte: '401100', libelle: `Fournisseur (TTC)`, sens: 'C', debit: 0, credit: data.montantTTC || 0, journal: journalCode });
      } else if (selectedDraft.type === BrouillardComptableDto.type.FACTURE_CLIENT) {
        details.push({ compte: '411100', libelle: `Client (TTC)`, sens: 'D', debit: data.montantTTC || 0, credit: 0, journal: journalCode });
        details.push({ compte: '701000', libelle: `Vente (HT) - ${data.numeroFacture || ''}`, sens: 'C', debit: 0, credit: data.montantHT || 0, journal: journalCode });
        if (data.montantTVA && data.montantTVA > 0) {
          details.push({ compte: '443100', libelle: `TVA Collectée`, sens: 'C', debit: 0, credit: data.montantTVA, journal: journalCode });
        }
      } else {
        details.push({ compte: '5XXXXX', libelle: selectedDraft.libelle || 'Mouvement', sens: 'D', debit: selectedDraft.montantTotal || 0, credit: 0, journal: journalCode });
        details.push({ compte: 'XXXXXX', libelle: 'Contrepartie', sens: 'C', debit: 0, credit: selectedDraft.montantTotal || 0, journal: journalCode });
      }
    }
    return details;
  };

  const previewLines = currentPreviewLines();
  const totalDebit = previewLines.reduce((acc, l) => acc + l.debit, 0);
  const totalCredit = previewLines.reduce((acc, l) => acc + l.credit, 0);

  const currentData: any = selectedDraft?.dataJson || {};
  const currentHT = Number(currentData.montantHT) || 0;
  const currentTaux = currentData.tauxTVA != null
    ? Number(currentData.tauxTVA)
    : (currentHT > 0 && currentData.montantTVA ? Math.round((Number(currentData.montantTVA) / currentHT) * 100) : 18);

  return (
    <div className="p-4 space-y-4 max-w-[1400px] mx-auto min-h-[calc(100vh-100px)] flex flex-col bg-gray-50/50">

      {/* Header and Actions */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-[#003366]">
            <FileStack className="w-5 h-5" />
            Saisie semi-automatique des écritures
          </h1>
        </div>
      </div>

      {/* TOP UPLOAD PANEL: Drag & Drop OCR */}
      <Card className={`rounded-md border shadow-sm border-dashed transition-colors ${isDragActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
        <div {...getRootProps()} className="cursor-pointer p-6 flex flex-col items-center justify-center text-center gap-3">
          <input {...getInputProps()} />
          <div className={`p-3 rounded-full ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {isUploading ? (
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <UploadCloud className={`w-6 h-6 ${isDragActive ? 'text-blue-600' : 'text-gray-500'}`} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              {isUploading ? "Analyse en cours..." : "Glissez une facture ou un reçu ici"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, PDF (Max 10MB). L'IA extraira automatiquement l'entête et le détail des lignes.
            </p>
          </div>
        </div>
      </Card>

      {/* TOP PANEL: Filters & List */}
      <Card className="rounded-md border shadow-sm">
        <CardHeader className="py-2.5 px-4 bg-muted/40 border-b">
          <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Critères de consultation et Liste</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-3 border-b bg-white text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Exercice:</span>
              <Select defaultValue="2024"><SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2024">2024</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Type:</span>
              <Select defaultValue="all"><SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Tous les types" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes opérations</SelectItem><SelectItem value="ventes">Les ventes</SelectItem><SelectItem value="achats">Les achats</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                <Input placeholder="Rechercher..." className="pl-8 h-8 max-w-[200px] text-xs" />
              </div>
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto bg-white border-b">
            <Table>
              <TableHeader className="sticky top-0 bg-blue-50/80 backdrop-blur-sm z-10 shadow-sm text-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px] h-8 text-blue-900 font-semibold border-r">N° Pièce / Facture</TableHead>
                  <TableHead className="h-8 text-blue-900 font-semibold border-r">Type / Client / Fournisseur</TableHead>
                  <TableHead className="w-[120px] text-right text-blue-900 font-semibold border-r h-8">Mt HT</TableHead>
                  <TableHead className="w-[120px] text-right text-blue-900 font-semibold border-r h-8">Mt TVA</TableHead>
                  <TableHead className="w-[120px] text-right text-blue-900 font-semibold h-8">Mt TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
                ) : drafts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun brouillard en attente</TableCell></TableRow>
                ) : drafts.map((draft, idx) => (
                  <TableRow
                    key={draft.id}
                    className={`cursor-pointer transition-colors text-xs border-b ${selectedDraft?.id === draft.id ? 'bg-[#cce5ff] hover:bg-[#cce5ff]' : idx % 2 === 0 ? 'bg-white' : 'bg-[#fff5e6]'}`}
                    onClick={() => setSelectedDraft(draft)}
                  >
                    <TableCell className="font-medium border-r py-1.5 px-3">
                      {draft.numeroPiece || draft.sourceId}
                    </TableCell>
                    <TableCell className="border-r py-1.5 px-3 uppercase">
                      {draft.type?.replace(/_/g, ' ')}
                      <span className="text-gray-500 lowercase ml-2 capitalize truncate">{draft.libelle ? ` - ${draft.libelle}` : ''}</span>
                    </TableCell>
                    <TableCell className="text-right border-r py-1.5 px-3 font-mono">
                      {draft.dataJson?.montantHT ? draft.dataJson.montantHT.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right border-r py-1.5 px-3 font-mono">
                      {draft.dataJson?.montantTVA ? draft.dataJson.montantTVA.toLocaleString() : '0,00'}
                    </TableCell>
                    <TableCell className="text-right py-1.5 px-3 font-mono font-medium">
                      {(draft.montantTotal || draft.dataJson?.montantTTC)?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* MIDDLE PANEL: Document Header */}
      <Card className="rounded-md border shadow-sm flex-shrink-0 opacity-100 transition-opacity">
        <CardHeader className="py-2.5 px-4 bg-muted/40 border-b">
          <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Entête Écriture / Opération Comptable</CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-white space-y-4">
          {selectedDraft ? (
            <div className="grid grid-cols-12 gap-4 items-end text-sm">
              <div className="col-span-8 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Pièce(s) Justificative(s)</label>
                <Input readOnly value={`${selectedDraft.type?.replace(/_/g, ' ')} : ${selectedDraft.numeroPiece || selectedDraft.sourceId} du ${selectedDraft.datePiece ? format(new Date(selectedDraft.datePiece), 'dd/MM/yyyy') : 'N/A'}`} className="bg-gray-50 text-xs h-8 border-gray-300 font-medium text-gray-900" />
              </div>
              <div className="col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">N° Saisie (Brouillard)</label>
                <Input readOnly value={selectedDraft.id?.split('-')[0].toUpperCase()} className="bg-gray-50 text-xs h-8 text-right font-mono font-bold text-blue-900 border-gray-300" />
              </div>

              <div className="col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Période / Exercice</label>
                <Input readOnly value={selectedDraft.periodeCode || 'Exercice Courant'} className="bg-gray-50 text-xs h-8 border-gray-300" />
              </div>
              <div className="col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Date de création prévue</label>
                <Input readOnly value={format(new Date(), 'dd/MM/yyyy')} className="bg-gray-50 text-xs h-8 border-gray-300" />
              </div>
              <div className="col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Journal</label>
                <Input readOnly value={`${selectedDraft.journalCode || 'JV'} - ${selectedDraft.journalLibelle || 'Journal non spécifié'}`} className="bg-gray-50 text-xs h-8 border-gray-300" />
              </div>

              <div className="col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Montant HT</label>
                <Input type="number" step="0.01" value={currentHT} onChange={(e) => applyFinancials(parseFloat(e.target.value), currentTaux)} className="text-xs h-8 border-gray-300 text-right font-mono" />
              </div>
              <div className="col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Taux TVA (%)</label>
                <Input type="number" step="0.1" value={currentTaux} onChange={(e) => applyFinancials(currentHT, parseFloat(e.target.value))} className="text-xs h-8 border-gray-300 text-right font-mono" />
              </div>
              <div className="col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Montant TTC</label>
                <Input readOnly value={(Number(currentData.montantTTC) || 0).toLocaleString()} className="bg-gray-50 text-xs h-8 border-gray-300 text-right font-mono font-semibold text-blue-900" />
              </div>

              <div className="col-span-12 flex flex-col gap-1.5 mt-1">
                <label className="text-[11px] font-semibold text-gray-500 uppercase">Description / Remarques</label>
                <Input readOnly value={selectedDraft.libelle || `Saisie semi-automatique des données relatives à l'opération de type ${selectedDraft.type}`} className="bg-gray-50 text-xs h-8 border-gray-300" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 text-sm text-gray-400">
              Sélectionnez une ligne dans le tableau ci-dessus pour afficher l'entête.
            </div>
          )}
        </CardContent>
      </Card>


      {/* BOTTOM PANEL: Document Lines */}
      <Card className="rounded-md border shadow-sm flex-1 flex flex-col min-h-0 mb-8">
        <CardHeader className="py-2.5 px-4 bg-muted/40 border-b">
          <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Détail écriture comptable</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col bg-white overflow-hidden relative">

          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="bg-gray-50/80 sticky top-0 z-10 shadow-sm border-b text-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] font-bold text-gray-700 h-8 border-r">N° Compte</TableHead>
                  <TableHead className="font-bold text-gray-700 h-8 border-r">Intitulé</TableHead>
                  <TableHead className="w-[60px] text-center font-bold text-gray-700 h-8 border-r">Sens</TableHead>
                  <TableHead className="w-[150px] text-right font-bold text-gray-700 h-8 border-r">Débit</TableHead>
                  <TableHead className="w-[150px] text-right font-bold text-gray-700 h-8 border-r">Crédit</TableHead>
                  <TableHead className="w-[80px] text-center font-bold text-gray-700 h-8">Journal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedDraft ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sélectionnez une ligne ci-dessus pour prévisualiser les écritures comptables générées.</TableCell></TableRow>
                ) : previewLines.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Aucune ligne générée (Format non supporté ou données incomplètes).</TableCell></TableRow>
                ) : (
                  previewLines.map((line, idx) => (
                    <TableRow key={idx} className="text-xs border-b hover:bg-gray-50/50">
                      <TableCell className="font-mono border-r py-2">{line.compte}</TableCell>
                      <TableCell className="border-r py-2 font-medium">{line.libelle}</TableCell>
                      <TableCell className="text-center border-r py-2 font-medium">{line.sens}</TableCell>
                      <TableCell className="text-right border-r py-2 font-mono text-gray-600 bg-red-50/20">
                        {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className="text-right border-r py-2 font-mono text-gray-600 bg-blue-50/20">
                        {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className="text-center py-2 font-medium">{line.journal}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bottom Total Footer & Actions */}
          <div className="bg-gray-100/80 border-t p-3 flex items-center justify-between text-sm mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 text-xs">Utilisateur :</span>
              <span className="px-3 border border-gray-300 bg-white rounded flex items-center h-7 text-xs font-medium text-gray-700">Administrateur</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600 text-xs">Débit :</span>
                <span className="px-3 border border-gray-300 bg-white rounded flex items-center h-7 text-xs font-mono font-bold text-red-600 min-w-[120px] justify-end">
                  {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600 text-xs">Crédit :</span>
                <span className="px-3 border border-gray-300 bg-white rounded flex items-center h-7 text-xs font-mono font-bold text-red-600 min-w-[120px] justify-end">
                  {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border-t p-2 flex justify-between items-center px-4">
            <Button variant="ghost" className="text-red-500 h-8 text-xs hover:text-red-700 hover:bg-red-50" onClick={() => setSelectedDraft(null)} disabled={!selectedDraft}>
              <XCircle className="w-4 h-4 mr-2" /> Effacer
            </Button>

            <PermissionGuard
              feature="journal_entries"
              action="validate"
              fallback={
                <span className="text-xs text-gray-400 italic px-3 py-1 bg-gray-100 rounded border border-gray-200">
                  Validation réservée au Comptable ou Responsable comptable
                </span>
              }
            >
              <Button
                onClick={handleValidate}
                disabled={!selectedDraft || isValidating || totalDebit !== totalCredit || totalDebit === 0}
                className="bg-[#0055aa] hover:bg-[#004080] h-8 text-xs font-medium shadow-sm transition-all text-white"
              >
                {isValidating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileStack className="w-4 h-4 mr-2" />}
                Valider & Enregistrer
              </Button>
            </PermissionGuard>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}