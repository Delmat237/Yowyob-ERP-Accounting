"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, RefreshCw, Eye, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountingAuditService } from '@/src/lib2/services/AccountingAuditService';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePeriodeComptableVisible } from '@/hooks/use-periode-comptable-visible';
import { PeriodeComptableVisibleSelector } from '@/components/accounting/periode-comptable-visible-selector';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { ANALYSE_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { OfflineCacheBanner } from '@/components/offline/offline-cache-banner';

interface SystemAudit {
  id: string;
  user?: string;
  action?: string;
  date: string;
  description: string;
  details?: string;
  adresseIp?: string;
  donneesAvant?: string;
  donneesApres?: string;
}

export default function AuditJournalPage() {
  const { periode, periodeId, loading: isLoadingPeriods, refresh } = usePeriodeComptableVisible();
  const [auditLogs, setAuditLogs] = useState<SystemAudit[]>([]);
  const [isFetchingAudits, setIsFetchingAudits] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<SystemAudit | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string>();

  const fetchAuditsData = useCallback(async () => {
    if (!periodeId) return;
    setIsFetchingAudits(true);
    try {
      const tenantId = localStorage.getItem('organization_id') || '';

      const result = await fetchWithOfflineCache({
        cacheKey: ANALYSE_CACHE_KEYS.audits(periodeId),
        fetcher: async () => {
          const response = periode && periode.dateDebut && periode.dateFin
            ? await AccountingAuditService.getByPeriode(tenantId, periode.dateDebut, periode.dateFin)
            : await AccountingAuditService.getAllByOrganization(tenantId, 100);
          const audits = response.data || [];
          return {
            success: true,
            data: audits.map((a) => ({
              id: a.id || '',
              user: a.utilisateur || 'Système',
              action: a.action || 'INCONNU',
              date: a.dateAction || a.createdAt || '',
              description: a.details || 'Aucune description',
              details: a.details || '',
              adresseIp: a.adresseIp || 'N/A',
              donneesAvant: a.donneesAvant,
              donneesApres: a.donneesApres,
            })),
          };
        },
        emptyValue: [] as SystemAudit[],
      });

      setUsingCache(result.fromCache);
      setCacheTimestamp(result.cachedAt);
      setAuditLogs(result.data);
    } catch (error) {
      console.error('Error fetching audits:', error);
      toast.error("Échec de la récupération des journaux d'audit");
    } finally {
      setIsFetchingAudits(false);
    }
  }, [periodeId, periode]);

  useEffect(() => {
    if (periodeId) {
      fetchAuditsData();
    }
  }, [periodeId, periode, fetchAuditsData]);

  const handleGeneratePDF = () => {
    toast.info("L'export PDF sera disponible prochainement");
  };

  const handleGenerateXLSX = () => {
    toast.info("L'export XLSX sera disponible prochainement");
  };

  const filteredAudits = auditLogs.filter(log =>
    log.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingPeriods) return <CustomPageLoader />;

  return (
    <PermissionGuard
      feature="audit_log"
      action="read"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4 p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md">
            <div className="p-4 bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <ShieldOff className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Accès refusé</h2>
            <p className="text-sm text-gray-500">
              Vous n'avez pas les droits nécessaires pour consulter le journal d'audit.
              Cette fonctionnalité est réservée aux Comptables et Responsables comptables.
            </p>
          </div>
        </div>
      }
    >
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <OfflineCacheBanner visible={usingCache} cachedAt={cacheTimestamp} />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Journal d&#39;Audit</h1>
            {isFetchingAudits && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGeneratePDF} disabled={isFetchingAudits || !periodeId}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" onClick={handleGenerateXLSX} disabled={isFetchingAudits || !periodeId}>
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
            <div className="relative w-96">
              <Input
                placeholder="Rechercher par utilisateur, action ou détails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <Button variant="ghost" size="icon" onClick={fetchAuditsData} title="Rafraîchir les audits">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardHeader className="bg-white border-b py-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Historique des actions (Données de démonstration)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 font-bold text-gray-700 w-40">Date & Heure</th>
                      <th className="px-4 py-3 font-bold text-gray-700 w-32">Utilisateur</th>
                      <th className="px-4 py-3 font-bold text-gray-700 w-32">Action</th>
                      <th className="px-4 py-3 font-bold text-gray-700">Détails de l'opération</th>
                      <th className="px-4 py-3 font-bold text-gray-700 w-32">Adresse IP</th>
                      <th className="px-4 py-3 font-bold text-gray-700 w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudits.length > 0 ? filteredAudits.map((log, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500">
                          {log.date ? new Date(log.date).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-tighter">
                            {log.user}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-tighter ${log.action === 'CREATE' || log.action === 'AJOUT' ? 'bg-green-100 text-green-800' :
                            log.action === 'UPDATE' || log.action === 'MODIFICATION' ? 'bg-amber-100 text-amber-800' :
                              log.action === 'DELETE' || log.action === 'SUPPRESSION' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-md truncate" title={log.description}>
                          {log.description}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400">
                          {log.adresseIp || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setSelectedAudit(log)}>
                                <Eye className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Détails de l'Audit</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Utilisateur</p>
                                    <p className="font-semibold">{selectedAudit?.user}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Date</p>
                                    <p className="font-semibold">{selectedAudit?.date ? new Date(selectedAudit.date).toLocaleString() : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Action</p>
                                    <p className="font-semibold">{selectedAudit?.action}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">IP</p>
                                    <p className="font-semibold">{selectedAudit?.adresseIp}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400 uppercase">Détails</p>
                                  <p className="mt-1 p-2 bg-gray-50 rounded border">{selectedAudit?.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase mb-1">Données Avant</p>
                                    <pre className="p-2 bg-red-50 text-[10px] rounded border overflow-auto max-h-40 whitespace-pre-wrap">
                                      {selectedAudit?.donneesAvant ? JSON.stringify(JSON.parse(selectedAudit.donneesAvant), null, 2) : 'Aucune donnée'}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase mb-1">Données Après</p>
                                    <pre className="p-2 bg-green-50 text-[10px] rounded border overflow-auto max-h-40 whitespace-pre-wrap">
                                      {selectedAudit?.donneesApres ? JSON.stringify(JSON.parse(selectedAudit.donneesApres), null, 2) : 'Aucune donnée'}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-20 text-center text-gray-400 italic">
                          {isFetchingAudits ? "Récupération des journaux d'audit..." : "Aucun journal d'audit trouvé pour cette période"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
}
