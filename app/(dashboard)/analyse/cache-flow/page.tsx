"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { useNationalCurrency } from '@/hooks/use-national-currency';
import { formatDateForApi } from '@/lib/utils';
import { toast } from 'sonner';
import { AccountingFinancialReportsService } from '@/src/lib2/services/AccountingFinancialReportsService';
import { usePeriodeComptableVisible } from '@/hooks/use-periode-comptable-visible';
import { PeriodeComptableVisibleSelector } from '@/components/accounting/periode-comptable-visible-selector';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { ANALYSE_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';

interface CashFlowData {
  code: string;
  description: string;
  amount: number;
  category: 'operationnel' | 'investissement' | 'financement';
}

export default function CashFlowPage() {
  const { nationalCurrency } = useNationalCurrency();
  const currencyCode = nationalCurrency?.code || 'XAF';
  const { periode, periodeId, loading: isLoadingPeriods, refresh } = usePeriodeComptableVisible();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string>();

  useEffect(() => {
    const fetchCashFlow = async () => {
      if (!periodeId || !periode) {
        setCashFlowData([]);
        return;
      }

      setIsLoadingData(true);
      try {
        const result = await fetchWithOfflineCache({
          cacheKey: ANALYSE_CACHE_KEYS.cashFlow(periodeId),
          fetcher: () => AccountingFinancialReportsService.generateCashFlow(
            formatDateForApi(periode.dateDebut),
            formatDateForApi(periode.dateFin),
          ),
          emptyValue: null,
        });
        setUsingCache(result.fromCache);
        setCacheTimestamp(result.cachedAt);

        const data = result.data as {
          operationnel?: CashFlowData[];
          investissement?: CashFlowData[];
          financement?: CashFlowData[];
        } | null;

        if (data) {
          setCashFlowData([
            ...(data.operationnel || []),
            ...(data.investissement || []),
            ...(data.financement || []),
          ]);
        } else {
          setCashFlowData([]);
          if (!result.fromCache) {
            toast.error("Erreur lors de la génération des flux de trésorerie.");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la génération des flux de trésorerie:", error);
        toast.error("Erreur lors de la génération des flux de trésorerie.");
        setCashFlowData([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    void fetchCashFlow();
  }, [periodeId, periode]);

  const handleGeneratePDF = () => {
    toast.info("L'export PDF sera disponible prochainement pour ce rapport");
  };

  const handleGenerateXLSX = () => {
    toast.info("L'export XLSX sera disponible prochainement");
  };

  const operationnel = cashFlowData.filter(item => item.category === 'operationnel');
  const investissement = cashFlowData.filter(item => item.category === 'investissement');
  const financement = cashFlowData.filter(item => item.category === 'financement');

  const totalOperationnel = operationnel.reduce((sum, item) => sum + item.amount, 0);
  const totalInvestissement = investissement.reduce((sum, item) => sum + item.amount, 0);
  const totalFinancement = financement.reduce((sum, item) => sum + item.amount, 0);
  const totalFluxNet = totalOperationnel + totalInvestissement + totalFinancement;

  if (isLoadingPeriods || isLoadingData) return <CustomPageLoader />;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Flux de Trésorerie</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGeneratePDF} disabled={!periodeId}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" onClick={handleGenerateXLSX} disabled={!periodeId}>
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
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <Card>
            <CardHeader className="bg-white border-b">
              <CardTitle className="flex justify-between items-center text-sm font-semibold uppercase tracking-wider text-gray-400">
                <span>Tableau des flux - État au {periode ? new Date(periode.dateFin).toLocaleDateString('fr-FR') : '...'}</span>
                <span className="text-sm font-normal normal-case">Devise: <span className="font-semibold text-gray-900">{currencyCode}</span></span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8 mt-6">
                {/* Activités opérationnelles */}
                <div>
                  <h2 className="text-lg font-semibold text-emerald-700 border-b pb-2 mb-4">Activités Opérationnelles</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Intitulé</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operationnel.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className={`px-4 py-3 text-right font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50/50 font-bold border-t-2 border-emerald-100">
                          <td colSpan={2} className="px-4 py-3 text-right text-emerald-900 uppercase text-xs tracking-wider">Flux opérationnel net</td>
                          <td className="px-4 py-3 text-right text-emerald-700">{totalOperationnel.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activités d'investissement */}
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 border-b pb-2 mb-4">Activités d'Investissement</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Intitulé</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investissement.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className={`px-4 py-3 text-right font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50/50 font-bold border-t-2 border-blue-100">
                          <td colSpan={2} className="px-4 py-3 text-right text-blue-900 uppercase text-xs tracking-wider">Flux d'investissement net</td>
                          <td className="px-4 py-3 text-right text-blue-700">{totalInvestissement.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activités de financement */}
                <div>
                  <h2 className="text-lg font-semibold text-purple-700 border-b pb-2 mb-4">Activités de Financement</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Intitulé</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financement.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                            <td className={`px-4 py-3 text-right font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-purple-50/50 font-bold border-t-2 border-purple-100">
                          <td colSpan={2} className="px-4 py-3 text-right text-purple-900 uppercase text-xs tracking-wider">Flux de financement net</td>
                          <td className="px-4 py-3 text-right text-purple-700">{totalFinancement.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Résumé */}
                <div className="pt-6 border-t flex flex-col items-end gap-1">
                  <div className="flex gap-8 text-sm">
                    <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Variation nette de trésorerie</span>
                    <span className={`text-xl w-32 text-right font-black ${totalFluxNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {totalFluxNet.toLocaleString()} {currencyCode}
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
