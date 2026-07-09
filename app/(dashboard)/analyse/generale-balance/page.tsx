"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, RefreshCw } from 'lucide-react';
import { AccountingFinancialReportsService } from '@/src/lib2/services/AccountingFinancialReportsService';
import { BalanceDesComptesDto } from '@/src/lib2/models/BalanceDesComptesDto';
import { toast } from 'sonner';
import { formatDateForApi } from '@/lib/utils';
import { useNationalCurrency } from '@/hooks/use-national-currency';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { usePeriodeComptableVisible } from '@/hooks/use-periode-comptable-visible';
import { PeriodeComptableVisibleSelector } from '@/components/accounting/periode-comptable-visible-selector';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { ANALYSE_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';

export default function GeneralBalancePage() {
  const { periode, periodeId, loading: isLoadingPeriods, refresh } = usePeriodeComptableVisible();
  const [balanceData, setBalanceData] = useState<BalanceDesComptesDto | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string>();

  const generateReport = useCallback(async () => {
    if (!periodeId || !periode) return;

    setIsGenerating(true);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: ANALYSE_CACHE_KEYS.balance(periodeId),
        fetcher: () => AccountingFinancialReportsService.generateBalance(
          formatDateForApi(periode.dateDebut),
          formatDateForApi(periode.dateFin),
        ),
        emptyValue: null,
      });
      setUsingCache(result.fromCache);
      setCacheTimestamp(result.cachedAt);
      setBalanceData(result.data);
      if (!result.data && !result.fromCache) {
        toast.error("Erreur lors de la génération de la balance");
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Échec de la génération de la balance");
    } finally {
      setIsGenerating(false);
    }
  }, [periodeId, periode]);

  useEffect(() => {
    if (periodeId && periode) {
      generateReport();
    }
  }, [periodeId, periode, generateReport]);

  const handleGeneratePDF = async () => {
    if (!periodeId || !periode) return;

    try {
      toast.info("Génération du PDF...");

      // Construct the PDF export URL
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';
      const pdfUrl = `${baseUrl}/api/accounting/rapport/balance/export/pdf?date_debut=${formatDateForApi(periode.dateDebut)}&date_fin=${formatDateForApi(periode.dateFin)}`;

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

  const handleGenerateXLSX = () => {
    toast.info("L'export XLSX sera disponible prochainement");
  };

  const filteredLignes = balanceData?.lignes?.filter(ligne =>
    ligne.noCompte?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ligne.libelle?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoadingPeriods) return <CustomPageLoader />;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Balance des Comptes</h1>
            {isGenerating && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGeneratePDF} disabled={isGenerating || !periodeId}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" onClick={handleGenerateXLSX} disabled={isGenerating || !periodeId}>
              <Download className="h-4 w-4 mr-2" /> XLSX
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <PeriodeComptableVisibleSelector
              periode={periode}
              loading={isLoadingPeriods}
              onRefresh={() => void refresh()}
            />
            <div className="relative w-64">
              <Input
                placeholder="Rechercher un compte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="bg-white border-b">
              <CardTitle className="flex justify-between items-center text-sm font-semibold uppercase tracking-wider text-gray-500">
                <span>Balance au {periode ? new Date(periode.dateFin).toLocaleDateString('fr-FR') : '...'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th rowSpan={2} className="px-3 py-4 border-r font-bold text-gray-700 w-24">N° Compte</th>
                      <th rowSpan={2} className="px-3 py-4 border-r font-bold text-gray-700 min-w-[200px]">Intitulé du compte</th>
                      <th colSpan={2} className="px-3 py-2 border-b border-r text-center font-bold text-blue-700">Ouverture</th>
                      <th colSpan={2} className="px-3 py-2 border-b border-r text-center font-bold text-amber-700">Mouvements</th>
                      <th colSpan={2} className="px-3 py-2 border-b text-center font-bold text-emerald-700">Solde Clôture</th>
                    </tr>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 border-r text-right font-medium text-gray-600">Débit</th>
                      <th className="px-3 py-2 border-r text-right font-medium text-gray-600">Crédit</th>
                      <th className="px-3 py-2 border-r text-right font-medium text-gray-600">Débit</th>
                      <th className="px-3 py-2 border-r text-right font-medium text-gray-600">Crédit</th>
                      <th className="px-3 py-2 border-r text-right font-medium text-gray-600">Débit</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLignes.length > 0 ? filteredLignes.map((ligne, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-2 border-r font-mono text-gray-500">{ligne.noCompte}</td>
                        <td className="px-3 py-2 border-r font-medium text-gray-900">{ligne.libelle}</td>
                        <td className="px-3 py-2 border-r text-right text-gray-600">{ligne.soldeOuvertureDebit?.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right text-gray-600">{ligne.soldeOuvertureCredit?.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right text-gray-600">{ligne.mouvementDebit?.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right text-gray-600">{ligne.mouvementCredit?.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right font-bold text-blue-600">{ligne.soldeClotureDebit?.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-bold text-red-600">{ligne.soldeClotureCredit?.toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400 italic">
                          {isGenerating ? "Génération de la balance..." : "Aucune ligne trouvée pour cette période"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-right uppercase text-[10px] tracking-widest text-gray-500">Totaux balance</td>
                      <td className="px-3 py-3 border-r text-right">{balanceData?.totalDebitOuverture?.toLocaleString()}</td>
                      <td className="px-3 py-3 border-r text-right">{balanceData?.totalCreditOuverture?.toLocaleString()}</td>
                      <td className="px-3 py-3 border-r text-right">{balanceData?.totalDebitMouvement?.toLocaleString()}</td>
                      <td className="px-3 py-3 border-r text-right">{balanceData?.totalCreditMouvement?.toLocaleString()}</td>
                      <td className="px-3 py-3 border-r text-right">{balanceData?.totalDebitCloture?.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{balanceData?.totalCreditCloture?.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}