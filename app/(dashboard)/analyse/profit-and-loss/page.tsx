"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, RefreshCw } from 'lucide-react';
import { AccountingFinancialReportsService } from '@/src/lib2/services/AccountingFinancialReportsService';
import { downloadReportPdfBlob } from '@/src/lib2/helpers/downloadReportPdf';
import { toast } from 'sonner';
import { formatDateForApi } from '@/lib/utils';
import { useNationalCurrency } from '@/hooks/use-national-currency';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { usePeriodeComptableVisible } from '@/hooks/use-periode-comptable-visible';
import { PeriodeComptableVisibleSelector } from '@/components/accounting/periode-comptable-visible-selector';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { ANALYSE_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';

interface ResultatItem {
  code: string;
  description: string;
  debit: number;
  credit: number;
  solde: number;
}

export default function ProfitAndLossPage() {
  const { nationalCurrency } = useNationalCurrency();
  const currencyCode = nationalCurrency?.code || 'XAF';
  const { periode, periodeId, loading: isLoadingPeriods, refresh } = usePeriodeComptableVisible();
  const [reportData, setReportData] = useState<{
    produits: ResultatItem[];
    charges: ResultatItem[];
  }>({ produits: [], charges: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string>();

  const generateReport = useCallback(async () => {
    if (!periodeId || !periode) return;

    setIsGenerating(true);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: ANALYSE_CACHE_KEYS.compteResultat(periodeId),
        fetcher: () => AccountingFinancialReportsService.generateCompteResultat(
          formatDateForApi(periode.dateDebut),
          formatDateForApi(periode.dateFin),
        ),
        emptyValue: null,
      });
      setUsingCache(result.fromCache);
      setCacheTimestamp(result.cachedAt);

      const data = result.data as { produits?: ResultatItem[]; charges?: ResultatItem[] } | null;
      if (data) {
        setReportData({
          produits: data.produits || [],
          charges: data.charges || [],
        });
      } else if (!result.fromCache) {
        toast.error("Erreur lors de la génération du compte de résultat");
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Échec de la génération du rapport");
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

      // Export via le client accounting authentifie (base URL + token + headers org/tenant)
      const blob = await downloadReportPdfBlob(
        '/api/accounting/rapport/compte-resultat/export/pdf',
        formatDateForApi(periode.dateDebut),
        formatDateForApi(periode.dateFin),
      );
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

  const filterItems = (items: ResultatItem[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const totalProduits = reportData.produits.reduce((sum, item) => sum + item.solde, 0);
  const totalCharges = reportData.charges.reduce((sum, item) => sum + item.solde, 0);
  const resultatNet = totalProduits + totalCharges;

  if (isLoadingPeriods) return <CustomPageLoader />;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Compte de Résultat</h1>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Période du {periode ? new Date(periode.dateDebut).toLocaleDateString('fr-FR') : '...'} au {periode ? new Date(periode.dateFin).toLocaleDateString('fr-FR') : '...'}</span>
                <span className="text-sm text-gray-500 font-normal">
                  Devise: <span className="font-semibold text-gray-900">{currencyCode}</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Produits */}
                <div>
                  <h2 className="text-lg font-semibold text-emerald-700 border-b pb-2 mb-4">Produits (Recettes)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Intitulé</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Débit</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Crédit</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterItems(reportData.produits).length > 0 ? filterItems(reportData.produits).map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.debit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.credit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {item.solde.toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                              {isGenerating ? "Génération encours..." : "Aucun produit trouvé"}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50/50 font-bold border-t-2 border-emerald-100">
                          <td colSpan={4} className="px-4 py-3 text-right text-emerald-900 uppercase text-xs tracking-wider">Total Produits</td>
                          <td className="px-4 py-3 text-right text-emerald-700">{totalProduits.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charges */}
                <div>
                  <h2 className="text-lg font-semibold text-orange-700 border-b pb-2 mb-4">Charges (Dépenses)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Intitulé</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Débit</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Crédit</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterItems(reportData.charges).length > 0 ? filterItems(reportData.charges).map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.debit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.credit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-600">
                              {item.solde.toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                              {isGenerating ? "Génération encours..." : "Aucune charge trouvée"}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-orange-50/50 font-bold border-t-2 border-orange-100">
                          <td colSpan={4} className="px-4 py-3 text-right text-orange-900 uppercase text-xs tracking-wider">Total Charges</td>
                          <td className="px-4 py-3 text-right text-orange-700">{totalCharges.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Résultat Net */}
                <div className="pt-6 border-t flex flex-col items-end gap-1">
                  <div className="flex gap-8 text-sm">
                    <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Produits</span>
                    <span className="font-bold text-emerald-800 text-lg w-32 text-right">{totalProduits.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-8 text-sm">
                    <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Charges</span>
                    <span className="font-bold text-orange-800 text-lg w-32 text-right">{Math.abs(totalCharges).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-8 border-t pt-1 mt-1 font-black">
                    <span className="text-gray-400 uppercase tracking-widest text-[10px]">Résultat Net</span>
                    <span className={`text-xl w-32 text-right ${resultatNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {resultatNet.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}