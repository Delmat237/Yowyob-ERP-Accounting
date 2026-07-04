"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Download,
  Search,
  RefreshCw,
  Printer,
  Filter,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowRight,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import { AccountingFinancialReportsService } from '@/src/lib2/services/AccountingFinancialReportsService';
import { AccountingPeriodsService } from '@/src/lib2/services/AccountingPeriodsService';
import { GrandLivreDto } from '@/src/lib2/models/GrandLivreDto';
import { toast } from 'sonner';
import { cn, formatDateForApi } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FilterMode = 'tous' | 'plage' | 'groupe' | 'selection';

export default function GeneralLedgerPage() {
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string | null>(null);
  const [ledgerData, setLedgerData] = useState<GrandLivreDto[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Advanced Filters
  const [filterMode, setFilterMode] = useState<FilterMode>('tous');
  const [accountStart, setAccountStart] = useState('');
  const [accountEnd, setAccountEnd] = useState('');
  const [accountGroup, setAccountGroup] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPeriodesData = useCallback(async () => {
    setIsLoadingPeriods(true);
    try {
      const response = await AccountingPeriodsService.getAllPeriodeComptables();
      if (response.success && Array.isArray(response.data)) {
        setPeriodes(response.data);
        if (response.data.length > 0 && !selectedPeriodeId) {
          // Find period covering today
          const today = new Date();
          const currentPeriod = response.data.find(p => {
            const start = new Date(p.dateDebut);
            const end = new Date(p.dateFin);
            return today >= start && today <= end;
          });

          setSelectedPeriodeId(currentPeriod?.id || response.data[0].id || null);
        }
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
      toast.error("Erreur lors de la récupération des périodes");
    } finally {
      setIsLoadingPeriods(false);
    }
  }, [selectedPeriodeId]);

  useEffect(() => {
    fetchPeriodesData();
  }, [fetchPeriodesData]);

  const generateReport = useCallback(async (options?: AutoRefreshOptions) => {
    if (!selectedPeriodeId) return;
    const periode = periodes.find(p => p.id === selectedPeriodeId);
    if (!periode) return;

    if (!options?.silent) setIsGenerating(true);
    try {
      const response = await AccountingFinancialReportsService.generateGrandLivre(
        formatDateForApi(periode.dateDebut),
        formatDateForApi(periode.dateFin)
      );

      if (response.success && Array.isArray(response.data)) {
        setLedgerData(response.data);
      } else {
        toast.error("Erreur lors de la génération du grand livre");
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Échec de la génération du grand livre");
    } finally {
      if (!options?.silent) setIsGenerating(false);
    }
  }, [selectedPeriodeId, periodes]);

  useEffect(() => {
    if (selectedPeriodeId) {
      void generateReport();
    }
  }, [selectedPeriodeId, generateReport]);

  useAutoRefresh(generateReport, [generateReport]);

  const handleGeneratePDF = async () => {
    if (!selectedPeriodeId) return;
    const periode = periodes.find(p => p.id === selectedPeriodeId);
    if (!periode) return;

    try {
      toast.info("Génération du PDF...");

      // Construct the PDF export URL
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';
      const pdfUrl = `${baseUrl}/api/accounting/rapport/grand-livre/export/pdf?date_debut=${formatDateForApi(periode.dateDebut)}&date_fin=${formatDateForApi(periode.dateFin)}`;

      // Fetch the PDF as a blob
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');

      // Clean up the blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error("PDF Export failed", error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const filteredData = useMemo(() => {
    let data = ledgerData;

    // Apply main filter modes
    if (filterMode === 'plage') {
      if (accountStart) data = data.filter(acc => (acc.noCompte || '') >= accountStart);
      if (accountEnd) data = data.filter(acc => (acc.noCompte || '') <= accountEnd);
    } else if (filterMode === 'groupe') {
      if (accountGroup) data = data.filter(acc => (acc.noCompte || '').startsWith(accountGroup));
    }

    // Apply search query
    if (searchQuery) {
      data = data.filter(acc =>
        acc.noCompte?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.libelleCompte?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return data;
  }, [ledgerData, filterMode, accountStart, accountEnd, accountGroup, searchQuery]);

  // Calculate Running Balances & Sort
  const processedData = useMemo(() => {
    let cumulativeTotal = 0;

    // 1. Sort accounts by noCompte strictly
    const sortedAccounts = [...filteredData].sort((a, b) =>
      (a.noCompte || '').localeCompare(b.noCompte || '')
    );

    return sortedAccounts.map(account => {
      let runningBalance = account.soldeOuverture || 0;

      // 2. Sort lines by date, then by ecritureId to ensure stability
      const sortedLines = [...(account.lignes || [])].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.ecritureId || '').localeCompare(b.ecritureId || '');
      });

      const lignesWithBalances = sortedLines.map(line => {
        runningBalance += (line.debit || 0) - (line.credit || 0);
        cumulativeTotal += (line.debit || 0) - (line.credit || 0);
        return {
          ...line,
          soldeLigne: runningBalance,
          soldeCumule: cumulativeTotal
        };
      });

      return {
        ...account,
        lignesWithBalances
      };
    }).filter(account => {
      // Filter out accounts with no movements (lines) in the selected period
      // User requirement: if no entries, the table/account should not be shown, even with opening balance.
      return account.lignes && account.lignes.length > 0;
    });
  }, [filteredData]);

  const grandTotals = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    processedData.forEach(account => {
      totalDebit += account.totalDebit || 0;
      totalCredit += account.totalCredit || 0;
    });
    return { totalDebit, totalCredit, solde: totalDebit - totalCredit };
  }, [processedData]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-white border-b z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-blue-200 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">GRAND LIVRE</h1>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Analyse détaillée des comptes</p>
              </div>
              {isGenerating && <RefreshCw className="h-4 w-4 animate-spin text-blue-500 ml-2" />}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-10 border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold" onClick={handleGeneratePDF}>
                <Printer className="h-4 w-4 mr-2" /> Imprimer
              </Button>
              <Button variant="outline" className="h-10 border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold">
                <Download className="h-4 w-4 mr-2" /> XLSX
              </Button>
              <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-6 pb-20">
        <div className="max-w-[1600px] mx-auto px-6 space-y-8">
          {/* Filters Panel */}
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <div className="bg-slate-50 border-b px-6 py-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Critères de sélection</span>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                {/* Period Selector */}
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Période d'analyse</label>
                  <Select value={selectedPeriodeId || ''} onValueChange={setSelectedPeriodeId} disabled={isGenerating}>
                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:ring-blue-500">
                      <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                      <SelectValue placeholder={isLoadingPeriods ? "Chargement..." : "Sélectionner une période"} />
                    </SelectTrigger>
                    <SelectContent>
                      {periodes.map((periode) => (
                        <SelectItem key={periode.id} value={periode.id!}>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{periode.code}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(periode.dateDebut).toLocaleDateString()} — {new Date(periode.dateFin).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode Selector */}
                <div className="lg:col-span-5 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode de filtrage</label>
                  <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)} className="w-full">
                    <TabsList className="grid grid-cols-4 h-11 bg-slate-100 p-1 rounded-xl">
                      <TabsTrigger value="tous" className="rounded-lg text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">TOUS</TabsTrigger>
                      <TabsTrigger value="plage" className="rounded-lg text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">PLAGE</TabsTrigger>
                      <TabsTrigger value="groupe" className="rounded-lg text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">GROUPE</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Dynamic Inputs based on mode */}
                <div className="lg:col-span-4 transition-all duration-300">
                  {filterMode === 'tous' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recherche globale</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="N° Compte ou intitulé..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-11 pl-10 bg-slate-50/50 border-slate-200"
                        />
                      </div>
                    </div>
                  )}
                  {filterMode === 'plage' && (
                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">De (Compte)</label>
                        <Input placeholder="101..." value={accountStart} onChange={(e) => setAccountStart(e.target.value)} className="h-11 font-mono uppercase" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">À (Compte)</label>
                        <Input placeholder="799..." value={accountEnd} onChange={(e) => setAccountEnd(e.target.value)} className="h-11 font-mono uppercase" />
                      </div>
                    </div>
                  )}
                  {filterMode === 'groupe' && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Le compte commence par...</label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Ex: 41" value={accountGroup} onChange={(e) => setAccountGroup(e.target.value)} className="h-11 pl-10 font-mono uppercase" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ledger Table Section */}
          <div className="bg-white rounded-lg shadow-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider sticky top-0 z-20 divide-x divide-slate-700">
                    <th className="px-3 py-3 text-left w-24">Compte</th>
                    <th className="px-3 py-3 text-left w-24">N° saisie</th>
                    <th className="px-3 py-3 text-left w-28">Date Ec</th>
                    <th className="px-3 py-3 text-left w-16">JN</th>
                    <th className="px-3 py-3 text-left min-w-[300px]">Pièce</th>
                    <th className="px-3 py-3 text-right w-32">Debit</th>
                    <th className="px-3 py-3 text-right w-32">Credit</th>
                    <th className="px-3 py-3 text-right w-32">Solde</th>
                    <th className="px-3 py-3 text-right w-36 bg-slate-900">Solde Cumule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {processedData.length > 0 ? processedData.map((account) => (
                    <React.Fragment key={account.noCompte}>
                      {/* Account Opening Balance / Header Row */}
                      {account.soldeOuverture !== 0 && (
                        <tr className="bg-slate-50/80 font-bold border-b border-slate-300">
                          <td className="px-3 py-2 font-mono text-blue-700">{account.noCompte}</td>
                          <td colSpan={4} className="px-3 py-2 uppercase text-slate-700 tracking-tight">
                            Report à nouveau — {account.libelleCompte}
                          </td>
                          <td className="px-3 py-2 text-right"></td>
                          <td className="px-3 py-2 text-right"></td>
                          <td className="px-3 py-2 text-right font-mono text-slate-900 border-l border-slate-200">
                            {account.soldeOuverture?.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                          </td>
                          <td className="px-3 py-2 bg-slate-100 border-l border-slate-200"></td>
                        </tr>
                      )}

                      {/* Transaction Lines */}
                      {account.lignesWithBalances?.map((line, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors divide-x divide-slate-100 border-b border-slate-50 items-center">
                          <td className="px-3 py-2 font-mono text-slate-500">{account.noCompte}</td>
                          <td className="px-3 py-2 font-mono text-slate-600 font-bold text-[11px]">{line.reference || line.ecritureId?.slice(0, 8) || '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{new Date(line.date || '').toLocaleDateString('fr-FR')}</td>
                          <td className="px-3 py-2 text-slate-500 font-bold">{line.journal}</td>
                          <td className="px-3 py-2 text-slate-900 truncate max-w-md">{line.libelle}</td>
                          <td className="px-3 py-2 text-right text-slate-900 font-mono">
                            {(line.debit ?? 0) > 0 ? line.debit?.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) : '0'}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-900 font-mono">
                            {(line.credit ?? 0) > 0 ? line.credit?.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) : '0'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                            {line.soldeLigne?.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-rose-600 bg-slate-50/50">
                            {line.soldeCumule?.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}

                      {/* Account Subtotal Row */}
                      <tr className="bg-blue-50/50 font-bold border-t border-slate-300">
                        <td className="px-3 py-2 font-mono text-blue-700">{account.noCompte}</td>
                        <td colSpan={4} className="px-3 py-2 text-blue-800 uppercase italic">
                          Sous total {account.noCompte} - {account.libelleCompte}
                        </td>
                        <td className="px-3 py-2 text-right text-blue-800 font-mono">
                          {account.totalDebit?.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-3 py-2 text-right text-blue-800 font-mono">
                          {account.totalCredit?.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-blue-900">
                          {account.soldeCloture?.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">
                        {isGenerating ? "Génération des données..." : "Aucune écriture pour cette période"}
                      </td>
                    </tr>
                  )}
                </tbody>
                {processedData.length > 0 && (
                  <tfoot className="border-t-4 border-blue-600 bg-blue-50 font-black">
                    <tr className="divide-x divide-blue-200">
                      <td colSpan={5} className="px-3 py-4 text-right uppercase tracking-[0.2em] text-blue-800">
                        Totaux cumulés
                      </td>
                      <td className="px-3 py-4 text-right font-mono text-blue-700 text-sm">
                        {grandTotals.totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-4 text-right font-mono text-blue-700 text-sm">
                        {grandTotals.totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-4 text-right font-mono text-blue-700 text-sm">
                        {grandTotals.solde.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-4 border-none"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}