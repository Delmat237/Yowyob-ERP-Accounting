"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, RefreshCw } from 'lucide-react';
import { AccountingFinancialReportsService } from '@/src/lib2/services/AccountingFinancialReportsService';
import { toast } from 'sonner';
import { formatDateForApi } from '@/lib/utils';
import { useNationalCurrency } from '@/hooks/use-national-currency';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { usePeriodeComptableVisible } from '@/hooks/use-periode-comptable-visible';
import { PeriodeComptableVisibleSelector } from '@/components/accounting/periode-comptable-visible-selector';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { ANALYSE_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';

interface BilanItem {
  code: string;
  description: string;
  debit: number;
  credit: number;
  solde: number;
}

export default function BalanceSheetPage() {
  const { nationalCurrency } = useNationalCurrency();
  const currencyCode = nationalCurrency?.code || 'XAF';
  const { periode, periodeId, loading: isLoadingPeriods, refresh } = usePeriodeComptableVisible();
  const [bilanSections, setBilanSections] = useState<{
    actifs: BilanItem[];
    passifs: BilanItem[];
    capitauxPropres: BilanItem[];
  }>({ actifs: [], passifs: [], capitauxPropres: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string>();

  const generateReport = useCallback(async () => {
    if (!periodeId || !periode) return;

    setIsGenerating(true);
    try {
      const result = await fetchWithOfflineCache({
        cacheKey: ANALYSE_CACHE_KEYS.bilan(periodeId),
        fetcher: () => AccountingFinancialReportsService.generateBilan(
          formatDateForApi(periode.dateDebut),
          formatDateForApi(periode.dateFin),
        ),
        emptyValue: null,
      });
      setUsingCache(result.fromCache);
      setCacheTimestamp(result.cachedAt);

      const data = result.data as { actifs?: BilanItem[]; passifs?: BilanItem[]; capitauxPropres?: BilanItem[] } | null;
      if (data) {
        setBilanSections({
          actifs: data.actifs || [],
          passifs: data.passifs || [],
          capitauxPropres: data.capitauxPropres || [],
        });
      } else if (!result.fromCache) {
        toast.error("Erreur lors de la génération du bilan");
      }
    } catch (error) {
      console.error('Error generating bilan:', error);
      if (!usingCache) toast.error("Échec de la génération du rapport");
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
      const pdfUrl = `${baseUrl}/api/accounting/rapport/bilan/export/pdf?date_debut=${formatDateForApi(periode.dateDebut)}&date_fin=${formatDateForApi(periode.dateFin)}`;

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

  const filterItems = (items: BilanItem[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const totalActifs = bilanSections.actifs.reduce((sum, item) => sum + item.solde, 0);
  const totalPassifs = bilanSections.passifs.reduce((sum, item) => sum + item.solde, 0);
  const totalCapitauxPropres = bilanSections.capitauxPropres.reduce((sum, item) => sum + item.solde, 0);

  if (isLoadingPeriods) return <CustomPageLoader />;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Bilan</h1>
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
                <span>Situation au {periode ? new Date(periode.dateFin).toLocaleDateString('fr-FR') : '...'}</span>
                <span className="text-sm text-gray-500 font-normal">
                  Devise: <span className="font-semibold text-gray-900">{currencyCode}</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Actifs */}
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 border-b pb-2 mb-4">Actifs</h2>
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
                        {filterItems(bilanSections.actifs).length > 0 ? filterItems(bilanSections.actifs).map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.debit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.credit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-600">
                              {item.solde.toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                              {isGenerating ? "Génération encours..." : "Aucun compte d'actif trouvé"}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-blue-50/50 font-bold border-t-2 border-blue-100">
                          <td colSpan={4} className="px-4 py-3 text-right text-blue-900 uppercase text-xs tracking-wider">Total Actifs</td>
                          <td className="px-4 py-3 text-right text-blue-700">{totalActifs.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Passifs */}
                <div>
                  <h2 className="text-lg font-semibold text-red-700 border-b pb-2 mb-4">Passifs (Dettes)</h2>
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
                        {filterItems(bilanSections.passifs).length > 0 ? filterItems(bilanSections.passifs).map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.debit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.credit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">
                              {item.solde.toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                              {isGenerating ? "Génération encours..." : "Aucun compte de passif trouvé"}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-red-50/50 font-bold border-t-2 border-red-100">
                          <td colSpan={4} className="px-4 py-3 text-right text-red-900 uppercase text-xs tracking-wider">Total Dettes</td>
                          <td className="px-4 py-3 text-right text-red-700">{totalPassifs.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Capitaux Propres */}
                <div>
                  <h2 className="text-lg font-semibold text-emerald-700 border-b pb-2 mb-4">Capitaux Propres</h2>
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
                        {filterItems(bilanSections.capitauxPropres).length > 0 ? filterItems(bilanSections.capitauxPropres).map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.debit.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.credit.toLocaleString()}</td>
                            <td className={`px-4 py-3 text-right font-bold ${item.solde >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {item.solde.toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                              {isGenerating ? "Génération encours..." : "Aucun compte de capitaux propres trouvé"}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50/50 font-bold border-t-2 border-emerald-100">
                          <td colSpan={4} className="px-4 py-3 text-right text-emerald-900 uppercase text-xs tracking-wider">Total Capitaux Propres</td>
                          <td className="px-4 py-3 text-right text-emerald-700">{totalCapitauxPropres.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Général / Équilibre */}
                <div className="pt-6 border-t flex flex-col items-end gap-1">
                  <div className="flex gap-8 text-sm">
                    <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Total Actif</span>
                    <span className="font-bold text-blue-800 text-lg w-32 text-right">{totalActifs.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-8 text-sm">
                    <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Total Passif + CP</span>
                    <span className="font-bold text-gray-800 text-lg w-32 text-right">{(totalPassifs + totalCapitauxPropres).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-8 border-t pt-1 mt-1 font-black">
                    <span className="text-gray-400 uppercase tracking-widest text-[10px]">Équilibre (Diff.)</span>
                    <span className={`text-xl w-32 text-right ${(totalActifs - (totalPassifs + totalCapitauxPropres)) === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(totalActifs - (totalPassifs + totalCapitauxPropres)).toLocaleString()}
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