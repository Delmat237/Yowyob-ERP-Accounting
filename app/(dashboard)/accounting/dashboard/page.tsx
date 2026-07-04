/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, type AutoRefreshOptions } from '@/hooks/use-auto-refresh';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Scale,
  Zap,
  CheckCircle2,
  MoreVertical,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Landmark,
  Receipt,
  Wallet,
  Users,
  ChevronRight,
  FileClock,
  FileText,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { useNationalCurrency } from '@/hooks/use-national-currency';
import { AccountingFinancialReportsService } from '@/src/lib2/services/AccountingFinancialReportsService';
import { AccountingEntriesService } from '@/src/lib2/services/AccountingEntriesService';
import { AccountingPeriodsService } from '@/src/lib2/services/AccountingPeriodsService';
import { AccountingJournalManagementService } from '@/src/lib2/services/AccountingJournalManagementService';
import { AccountingAuditService } from '@/src/lib2/services/AccountingAuditService';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { toast } from 'sonner';
import { formatDateForApi } from '@/lib/utils';
import { cn } from '@/lib/utils';

/* ────────────────── helpers ────────────────── */
const fmtAmount = (v: number, currency: string) =>
  `${v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toFixed(0);
};

const CustomTooltipAmt = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {fmtAmount(p.value, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ────────────────── component ────────────────── */
export default function AccountingDashboard() {
  const { nationalCurrency } = useNationalCurrency();
  const currencyCode = nationalCurrency?.code || 'XAF';
  const { accountingRole } = useAuth();

  /* ── state ── */
  const [isLoading, setIsLoading] = useState(true);
  const [activePeriodCode, setActivePeriodCode] = useState('Chargement...');

  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingEntries: 0,
    totalDebit: 0,
    totalCredit: 0,
    totalEntries: 0,
  });

  const [ratios, setRatios] = useState({
    netMargin: 0,
    liquidityRatio: 0,
    debtRatio: 0,
  });

  const [systemHealth, setSystemHealth] = useState({
    isBalanced: true,
    lastCheck: 'N/A',
    alerts: 0,
  });

  const [journalActivity, setJournalActivity] = useState<any[]>([]);
  const [balanceLines, setBalanceLines] = useState<any[]>([]); // top accounts by movement
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [recentOps, setRecentOps] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState<any[]>([
    // Données de démonstration affichées tant que le backend ne répond pas
    { period: 'Jan', Revenus: 1200000, Dépenses: 850000, Résultat: 350000 },
    { period: 'Fév', Revenus: 1450000, Dépenses: 920000, Résultat: 530000 },
    { period: 'Mar', Revenus: 1100000, Dépenses: 1050000, Résultat: 50000 },
    { period: 'Avr', Revenus: 1800000, Dépenses: 1100000, Résultat: 700000 },
    { period: 'Mai', Revenus: 1600000, Dépenses: 980000, Résultat: 620000 },
    { period: 'Jun', Revenus: 2100000, Dépenses: 1300000, Résultat: 800000 },
  ]);
  const [periodsList, setPeriodsList] = useState<any[]>([]);

  /* ── fetch ── */
  const fetchDashboardData = useCallback(async (options?: AutoRefreshOptions) => {
    if (!options?.silent) setIsLoading(true);
    try {
      /* 1. Periods */
      const periodsRes = await AccountingPeriodsService.getAllPeriodeComptables();
      const periods = periodsRes.data || [];
      setPeriodsList(periods);

      const now = new Date();
      const activePeriod = periods.find(p => {
        const s = new Date(p.dateDebut);
        const e = new Date(p.dateFin);
        return now >= s && now <= e;
      }) || periods[0];

      if (!activePeriod) {
        toast.warning("Aucune période comptable trouvée.");
        setIsLoading(false);
        return;
      }
      setActivePeriodCode(activePeriod.code || 'Période Active');

      const deb = formatDateForApi(activePeriod.dateDebut);
      const fin = formatDateForApi(activePeriod.dateFin);

      /* 2. Executive summary */
      const [summaryRes, bilanRes, resultatRes, balanceRes, cashRes] = await Promise.allSettled([
        AccountingFinancialReportsService.generateExecutiveSummary(deb, fin),
        AccountingFinancialReportsService.generateBilan(deb, fin),
        AccountingFinancialReportsService.generateCompteResultat(deb, fin),
        AccountingFinancialReportsService.generateBalance(deb, fin),
        AccountingFinancialReportsService.generateCashFlow(deb, fin),
      ]);

      /* -- Executive summary -- */
      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) {
        const d = summaryRes.value.data as any;
        const rev = Number(d?.total_revenu || 0);
        const exp = Number(d?.total_depense || 0);
        const net = Number(d?.resultat_net || 0);
        const totD = Number(d?.total_debit || 0);
        const totC = Number(d?.total_credit || 0);

        setKpis(prev => ({
          ...prev,
          totalRevenue: rev,
          totalExpenses: exp,
          netProfit: net,
          totalDebit: totD,
          totalCredit: totC,
        }));

        const balanced = Math.abs(totD - totC) < 0.01;
        setSystemHealth({
          isBalanced: balanced,
          lastCheck: new Date().toLocaleTimeString('fr-FR'),
          alerts: balanced ? 0 : 1,
        });

        if (!balanced && totD > 0) {
          toast.error("Déséquilibre détecté : Total Débit ≠ Total Crédit !");
        }

        // net margin
        if (rev > 0) {
          setRatios(prev => ({ ...prev, netMargin: Number(((net / rev) * 100).toFixed(1)) }));
        }
      }

      /* -- Bilan (liquidity & debt) -- */
      if (bilanRes.status === 'fulfilled' && bilanRes.value.success) {
        const bd = bilanRes.value.data as any;
        const ca = Number(bd?.total_actif_circulant || 0);
        const cl = Number(bd?.total_passif_circulant || 0);
        const totalDebt = Number(bd?.total_passif || 0);
        const totalAssets = Number(bd?.total_actif || 0);
        if (cl > 0) setRatios(prev => ({ ...prev, liquidityRatio: Number((ca / cl).toFixed(2)) }));
        if (totalAssets > 0) setRatios(prev => ({ ...prev, debtRatio: Number(((totalDebt / totalAssets) * 100).toFixed(1)) }));
      }

      /* -- Compte de Résultat (income vs expense chart per category) -- */
      if (resultatRes.status === 'fulfilled' && resultatRes.value.success) {
        const rd = resultatRes.value.data as any;
        const produits: any[] = rd?.produits ? Object.entries(rd.produits) : [];
        const charges: any[] = rd?.charges ? Object.entries(rd.charges) : [];
        const combined = [
          ...produits.slice(0, 5).map(([name, value]: any) => ({
            name: name.length > 18 ? name.slice(0, 18) + '…' : name,
            Revenu: Number(value) || 0,
            Charge: 0,
          })),
          ...charges.slice(0, 5).map(([name, value]: any) => ({
            name: name.length > 18 ? name.slice(0, 18) + '…' : name,
            Revenu: 0,
            Charge: Number(value) || 0,
          })),
        ];
        if (combined.length > 0) setIncomeVsExpense(combined);
      }

      /* -- Balance des comptes (top accounts) -- */
      if (balanceRes.status === 'fulfilled' && balanceRes.value.success) {
        const lignes = (balanceRes.value.data as any)?.lignes || [];
        const sorted = [...lignes]
          .sort((a: any, b: any) =>
            (Math.abs(Number(b.mouvementDebit || 0)) + Math.abs(Number(b.mouvementCredit || 0))) -
            (Math.abs(Number(a.mouvementDebit || 0)) + Math.abs(Number(a.mouvementCredit || 0)))
          )
          .slice(0, 7)
          .map((l: any) => ({
            compte: l.noCompte || '?',
            libelle: (l.libelle || 'Compte')?.slice(0, 22),
            debit: Number(l.mouvementDebit || 0),
            credit: Number(l.mouvementCredit || 0),
            solde: Number(l.soldeClotureDebit || 0) - Number(l.soldeClotureCredit || 0),
          }));
        setBalanceLines(sorted);
      }

      /* -- Cash Flow -- */
      if (cashRes.status === 'fulfilled' && cashRes.value.success) {
        const cf = cashRes.value.data as any;
        const rows = [
          { name: 'Exploitation', value: Number(cf?.flux_exploitation || cf?.fluxExploitation || 0) },
          { name: 'Investissement', value: Number(cf?.flux_investissement || cf?.fluxInvestissement || 0) },
          { name: 'Financement', value: Number(cf?.flux_financement || cf?.fluxFinancement || 0) },
        ].filter(r => r.value !== 0);
        if (rows.length > 0) setCashFlowData(rows);
      }

      /* 3. Journals */
      const journalsRes = await AccountingJournalManagementService.getAllJournals();
      if (journalsRes.success && Array.isArray(journalsRes.data)) {
        const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6'];
        setJournalActivity(journalsRes.data.map((j, i) => ({
          name: j.libelle || j.codeJournal,
          code: j.codeJournal,
          count: j.ecritureComptable?.length || 0,
          color: COLORS[i % COLORS.length],
        })));
      }

      /* 4. Pending entries */
      const nonValidatedRes = await AccountingEntriesService.getNonValidated();
      const pending = (nonValidatedRes as any).data?.length || 0;
      setKpis(prev => ({ ...prev, pendingEntries: pending }));

      /* 5. Recent operations */
      const entriesRes = await AccountingEntriesService.getAll1();
      const allEntries = (entriesRes.data || []);
      setKpis(prev => ({ ...prev, totalEntries: allEntries.length }));
      const recent = allEntries.slice(0, 10).map((e: any) => ({
        id: e.id,
        libelle: e.libelle || 'Opération',
        journal: e.codeJournal || 'GEN',
        debit: e.montantTotalDebit || 0,
        credit: e.montantTotalCredit || 0,
        date: e.dateEcriture ? new Date(e.dateEcriture).toLocaleDateString('fr-FR') : '—',
        status: e.statut || e.validee ? 'VALIDATED' : 'DRAFT',
      }));
      setRecentOps(recent);

      // Multi-period revenue trend (last N periods)
      const sortedPeriods = [...periods]
        .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
        .slice(-6);

      const trendData = await Promise.allSettled(
        sortedPeriods.map(async p => {
          try {
            const r = await AccountingFinancialReportsService.generateExecutiveSummary(
              formatDateForApi(p.dateDebut),
              formatDateForApi(p.dateFin)
            );
            const dd = r.data as any;
            return {
              period: p.code,
              Revenus: Number(dd?.total_revenu || 0),
              Dépenses: Number(dd?.total_depense || 0),
              Résultat: Number(dd?.resultat_net || 0),
            };
          } catch {
            return { period: p.code, Revenus: 0, Dépenses: 0, Résultat: 0 };
          }
        })
      );

      const trends = trendData
        .filter(r => r.status === 'fulfilled')
        .map((r: any) => r.value);
      if (trends.length > 1) setIncomeVsExpense(trends);

    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      toast.error("Erreur lors de la mise à jour du tableau de bord");
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchDashboardData(); }, [fetchDashboardData]);
  useAutoRefresh(fetchDashboardData, [fetchDashboardData]);

  if (isLoading && kpis.totalRevenue === 0 && kpis.totalDebit === 0) {
    return <CustomPageLoader />;
  }

  const isProfit = kpis.netProfit >= 0;

  /* ── role-specific config ── */
  const roleConfig = accountingRole === 'AIDE_COMPTABLE'
    ? {
        title: 'Mes Écritures & Saisies',
        subtitle: 'Suivez vos brouillons et imputations analytiques',
        badgeLabel: 'Aide-comptable',
        badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300',
      }
    : accountingRole === 'COMPTABLE'
    ? {
        title: 'Tableau de Bord Comptable',
        subtitle: 'Supervision des écritures et validation',
        badgeLabel: 'Comptable',
        badgeClass: 'bg-blue-100 text-blue-700 border border-blue-300',
      }
    : {
        title: 'Vue d\'ensemble financière',
        subtitle: 'Pilotage global du module comptabilité',
        badgeLabel: 'Responsable comptable',
        badgeClass: 'bg-violet-100 text-violet-700 border border-violet-300',
      };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">
            <Activity className="h-3.5 w-3.5" />
            Tableau de Bord Comptable — Période : <span className="text-slate-700">{activePeriodCode}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{roleConfig.title}</h1>
            <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full", roleConfig.badgeClass)}>
              {roleConfig.badgeLabel}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{roleConfig.subtitle}</p>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {accountingRole === 'AIDE_COMPTABLE' ? (
          /* KPIs pour AIDE_COMPTABLE */
          [
            {
              label: 'Mes brouillons',
              value: kpis.pendingEntries.toString(),
              icon: FileClock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              border: 'border-l-amber-500',
              sub: 'Écritures non validées',
            },
            {
              label: 'Écritures saisies',
              value: kpis.totalEntries.toString(),
              icon: FileText,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              border: 'border-l-blue-500',
              sub: 'Total des écritures',
            },
            {
              label: 'Période active',
              value: activePeriodCode,
              icon: Calendar,
              color: 'text-slate-600',
              bg: 'bg-slate-100',
              border: 'border-l-slate-400',
              sub: 'Période comptable en cours',
            },
            {
              label: 'Équilibre',
              value: systemHealth.isBalanced ? 'OK' : 'Déséquilibre',
              icon: ShieldCheck,
              color: systemHealth.isBalanced ? 'text-emerald-600' : 'text-rose-600',
              bg: systemHealth.isBalanced ? 'bg-emerald-50' : 'bg-rose-50',
              border: systemHealth.isBalanced ? 'border-l-emerald-500' : 'border-l-rose-500',
              sub: `Vérifié à ${systemHealth.lastCheck}`,
            },
          ].map((kpi, i) => (
            <Card key={i} className={cn("border-none shadow-sm border-l-4 bg-white", kpi.border)}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl shrink-0", kpi.bg)}>
                  <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
                  <p className={cn("text-xl font-black tracking-tight mt-0.5", kpi.color)}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : accountingRole === 'COMPTABLE' ? (
          /* KPIs pour COMPTABLE */
          [
            {
              label: 'Revenus',
              value: fmtAmount(kpis.totalRevenue, currencyCode),
              icon: TrendingUp,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              border: 'border-l-emerald-500',
              sub: `${kpis.totalEntries} écritures enregistrées`,
            },
            {
              label: 'Charges',
              value: fmtAmount(kpis.totalExpenses, currencyCode),
              icon: TrendingDown,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
              border: 'border-l-rose-500',
              sub: `Ratio: ${kpis.totalRevenue > 0 ? ((kpis.totalExpenses / kpis.totalRevenue) * 100).toFixed(0) : 0}% des revenus`,
            },
            {
              label: 'À valider',
              value: kpis.pendingEntries.toString(),
              icon: Clock,
              color: kpis.pendingEntries > 5 ? 'text-amber-600' : 'text-slate-600',
              bg: kpis.pendingEntries > 5 ? 'bg-amber-50' : 'bg-slate-100',
              border: kpis.pendingEntries > 5 ? 'border-l-amber-500' : 'border-l-slate-400',
              sub: 'Brouillons en attente de validation',
            },
            {
              label: 'Équilibre',
              value: systemHealth.isBalanced ? 'OK' : 'Déséquilibre',
              icon: ShieldCheck,
              color: systemHealth.isBalanced ? 'text-emerald-600' : 'text-rose-600',
              bg: systemHealth.isBalanced ? 'bg-emerald-50' : 'bg-rose-50',
              border: systemHealth.isBalanced ? 'border-l-emerald-500' : 'border-l-rose-500',
              sub: `Vérifié à ${systemHealth.lastCheck}`,
            },
          ].map((kpi, i) => (
            <Card key={i} className={cn("border-none shadow-sm border-l-4 bg-white", kpi.border)}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl shrink-0", kpi.bg)}>
                  <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
                  <p className={cn("text-xl font-black tracking-tight mt-0.5", kpi.color)}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          /* KPIs pour RESPONSABLE_COMPTABLE (défaut) */
          [
            {
              label: 'Revenus de la période',
              value: fmtAmount(kpis.totalRevenue, currencyCode),
              icon: TrendingUp,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              border: 'border-l-emerald-500',
              sub: `${(kpis.totalEntries)} écritures enregistrées`,
            },
            {
              label: 'Charges de la période',
              value: fmtAmount(kpis.totalExpenses, currencyCode),
              icon: TrendingDown,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
              border: 'border-l-rose-500',
              sub: `Ratio: ${kpis.totalRevenue > 0 ? ((kpis.totalExpenses / kpis.totalRevenue) * 100).toFixed(0) : 0}% des revenus`,
            },
            {
              label: 'Résultat Net',
              value: fmtAmount(kpis.netProfit, currencyCode),
              icon: isProfit ? ArrowUpRight : ArrowDownRight,
              color: isProfit ? 'text-indigo-600' : 'text-rose-600',
              bg: isProfit ? 'bg-indigo-50' : 'bg-rose-50',
              border: isProfit ? 'border-l-indigo-500' : 'border-l-rose-500',
              sub: `Marge nette: ${ratios.netMargin}%`,
            },
            {
              label: 'Écritures en attente',
              value: kpis.pendingEntries.toString(),
              icon: Clock,
              color: kpis.pendingEntries > 5 ? 'text-amber-600' : 'text-slate-600',
              bg: kpis.pendingEntries > 5 ? 'bg-amber-50' : 'bg-slate-100',
              border: kpis.pendingEntries > 5 ? 'border-l-amber-500' : 'border-l-slate-400',
              sub: 'À valider par un comptable',
            },
          ].map((kpi, i) => (
            <Card key={i} className={cn("border-none shadow-sm border-l-4 bg-white", kpi.border)}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl shrink-0", kpi.bg)}>
                  <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
                  <p className={cn("text-xl font-black tracking-tight mt-0.5", kpi.color)}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── Ratios + Health — masqué pour AIDE_COMPTABLE ── */}
      {accountingRole !== 'AIDE_COMPTABLE' && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Marge Nette',
            value: `${ratios.netMargin}%`,
            icon: Zap,
            color: 'indigo',
            hint: ratios.netMargin > 10 ? 'Bonne performance' : 'À surveiller',
            ok: ratios.netMargin > 0,
          },
          {
            label: 'Ratio de Liquidité',
            value: ratios.liquidityRatio.toFixed(2),
            icon: Scale,
            color: 'sky',
            hint: ratios.liquidityRatio >= 1 ? 'Solvable' : 'Risque de liquidité',
            ok: ratios.liquidityRatio >= 1,
          },
          {
            label: "Taux d'Endettement",
            value: `${ratios.debtRatio}%`,
            icon: Landmark,
            color: 'violet',
            hint: ratios.debtRatio < 70 ? 'Niveau acceptable' : 'Endettement élevé',
            ok: ratios.debtRatio < 70,
          },
          {
            label: 'Intégrité des Écritures',
            value: systemHealth.isBalanced ? 'Équilibrée' : 'Déséquilibre !',
            icon: ShieldCheck,
            color: systemHealth.isBalanced ? 'emerald' : 'rose',
            hint: `Vérifié à ${systemHealth.lastCheck}`,
            ok: systemHealth.isBalanced,
            anim: !systemHealth.isBalanced,
          },
        ].map((r, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                r.color === 'indigo' && 'bg-indigo-50 text-indigo-600',
                r.color === 'sky' && 'bg-sky-50 text-sky-600',
                r.color === 'violet' && 'bg-violet-50 text-violet-600',
                r.color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                r.color === 'rose' && 'bg-rose-50 text-rose-600',
              )}>
                <r.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{r.label}</p>
                <p className={cn("text-sm font-black",
                  r.ok ? 'text-slate-800' : 'text-rose-600',
                  r.anim && 'animate-pulse'
                )}>{r.value}</p>
                <p className={cn("text-[9px] font-bold", r.ok ? 'text-emerald-500' : 'text-amber-500')}>{r.hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* ── MAIN CHARTS ROW — masqué pour AIDE_COMPTABLE ── */}
      {accountingRole !== 'AIDE_COMPTABLE' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend Chart (multi-period) */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Évolution Revenus / Charges / Résultat
            </CardTitle>
            <CardDescription>Comparaison sur les dernières périodes comptables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height={280} minWidth={0}>
                <AreaChart data={incomeVsExpense} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                  <Tooltip content={<CustomTooltipAmt currency={currencyCode} />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine y={0} stroke="#e2e8f0" />
                  <Area type="monotone" dataKey="Revenus" stroke="#10b981" strokeWidth={2} fill="url(#gRev)" dot={{ r: 3, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="Dépenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gDep)" dot={{ r: 3, fill: '#f43f5e' }} />
                  <Area type="monotone" dataKey="Résultat" stroke="#6366f1" strokeWidth={2} fill="url(#gRes)" dot={{ r: 3, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Journal Activity */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Activité par Journal
            </CardTitle>
            <CardDescription>Répartition des écritures</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[160px] px-4">
              <ResponsiveContainer width="100%" height={160} minWidth={0}>
                <PieChart>
                  <Pie
                    data={journalActivity}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {journalActivity.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} écriture(s)`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="divide-y divide-slate-50 max-h-[160px] overflow-y-auto">
              {journalActivity.map((j, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: j.color }} />
                    <div>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{j.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{j.code}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{j.count}</span>
                </div>
              ))}
              {journalActivity.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Aucun journal disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* ── SECOND ROW — masqué pour AIDE_COMPTABLE ── */}
      {accountingRole !== 'AIDE_COMPTABLE' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Balance sheet — top accounts */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-indigo-500" />
              Soldes des Comptes — Top 7 par mouvement
            </CardTitle>
            <CardDescription>Balance des comptes de la période active</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {balanceLines.length > 0 ? (
              <div className="h-[240px] px-4 pb-4 pt-2">
                <ResponsiveContainer width="100%" height={240} minWidth={0}>
                  <BarChart
                    data={balanceLines}
                    layout="vertical"
                    margin={{ top: 0, right: 15, left: 0, bottom: 0 }}
                    barSize={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                    <YAxis type="category" dataKey="libelle" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip formatter={(v: any, name: string) => [fmtAmount(v, currencyCode), name]} />
                    <Bar dataKey="debit" name="Débit" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="credit" name="Crédit" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400 py-12">Aucune donnée de balance disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow + Debit/Credit Summary */}
        <div className="space-y-4">
          {/* Debit vs Credit */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-indigo-500" />
                Débit vs Crédit Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height={100} minWidth={0}>
                  <BarChart data={[
                    { name: 'Débit', total: kpis.totalDebit, fill: '#6366f1' },
                    { name: 'Crédit', total: kpis.totalCredit, fill: '#f43f5e' },
                  ]} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                    <Tooltip formatter={(v: any) => [fmtAmount(v, currencyCode), '']} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                      {[kpis.totalDebit, kpis.totalCredit].map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#6366f1' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={cn(
                "text-center text-[10px] font-bold mt-1 py-1 rounded-lg",
                systemHealth.isBalanced ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50 animate-pulse'
              )}>
                {systemHealth.isBalanced ? '✓ Parfaitement équilibré' : `⚠ Écart: ${fmtAmount(Math.abs(kpis.totalDebit - kpis.totalCredit), currencyCode)}`}
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow */}
          {cashFlowData.length > 0 && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Flux de Trésorerie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cashFlowData.map((row, i) => {
                    const isPos = row.value >= 0;
                    const maxVal = Math.max(...cashFlowData.map(r => Math.abs(r.value)));
                    const pct = maxVal > 0 ? (Math.abs(row.value) / maxVal) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span>{row.name}</span>
                          <span className={isPos ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPos ? '+' : ''}{fmtShort(row.value)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", isPos ? 'bg-emerald-500' : 'bg-rose-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      )}

      {/* ── BOTTOM ROW: Recent Ops + Audit ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Journal des Opérations */}
        <Card className="lg:col-span-8 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base font-black text-slate-800">
                {accountingRole === 'AIDE_COMPTABLE' ? 'Mes dernières saisies' : 'Journal des Opérations Récentes'}
              </CardTitle>
              <CardDescription>
                {accountingRole === 'AIDE_COMPTABLE'
                  ? 'Vos brouillons en attente de validation'
                  : 'Les 10 dernières écritures comptables'}
              </CardDescription>
            </div>
            <a href="/accounting/entries" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              Tout voir <ChevronRight className="h-3 w-3" />
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Libellé</th>
                    <th className="px-5 py-3">Journal</th>
                    <th className="px-5 py-3 text-right">Débit</th>
                    <th className="px-5 py-3 text-right">Crédit</th>
                    <th className="px-5 py-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(accountingRole === 'AIDE_COMPTABLE'
                    ? recentOps.filter(op => op.status !== 'VALIDATED')
                    : recentOps
                  ).map((op, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors text-xs">
                      <td className="px-5 py-3 font-mono text-slate-500 text-[11px]">{op.date}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800 max-w-[200px] truncate">{op.libelle}</td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{op.journal}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-indigo-700">{op.debit > 0 ? fmtShort(op.debit) : '—'}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-rose-700">{op.credit > 0 ? fmtShort(op.credit) : '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                          op.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        )}>
                          {op.status === 'VALIDATED' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                          {op.status === 'VALIDATED' ? 'Validé' : 'Brouillon'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(accountingRole === 'AIDE_COMPTABLE'
                    ? recentOps.filter(op => op.status !== 'VALIDATED')
                    : recentOps
                  ).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-400 text-xs py-10">
                        {accountingRole === 'AIDE_COMPTABLE'
                          ? 'Aucun brouillon en attente'
                          : 'Aucune écriture disponible'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Résumé financier + health — masqué pour AIDE_COMPTABLE */}
        <div className="lg:col-span-4 space-y-4">
          {accountingRole !== 'AIDE_COMPTABLE' ? (
            <>
              {/* Summary dark card */}
              <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 overflow-hidden opacity-5">
                  <TrendingUp className="h-72 w-72 -right-10 -bottom-10 absolute" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Résultat Net de la Période</p>
                  <h2 className={cn("text-3xl font-black mb-4", isProfit ? 'text-emerald-400' : 'text-rose-400')}>
                    {isProfit ? '+' : ''}{fmtAmount(kpis.netProfit, currencyCode)}
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Revenus', value: kpis.totalRevenue, color: 'text-emerald-400' },
                      { label: 'Charges', value: kpis.totalExpenses, color: 'text-rose-400' },
                      { label: 'Total Débit', value: kpis.totalDebit, color: 'text-indigo-400' },
                      { label: 'Total Crédit', value: kpis.totalCredit, color: 'text-sky-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                        <span className={cn("text-xs font-black", item.color)}>{fmtShort(item.value)}</span>
                      </div>
                    ))}
                    <div className="h-px bg-slate-800 my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Marge Nette</span>
                      <span className={cn("text-xs font-black", ratios.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{ratios.netMargin}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Liquidité</span>
                      <span className={cn("text-xs font-black", ratios.liquidityRatio >= 1 ? 'text-emerald-400' : 'text-amber-400')}>{ratios.liquidityRatio}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alerts — Comptable & Responsable uniquement */}
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Alertes & Contrôles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    {
                      ok: systemHealth.isBalanced,
                      label: systemHealth.isBalanced ? 'Écritures équilibrées' : 'Déséquilibre Débit/Crédit',
                      sub: `Vérifié à ${systemHealth.lastCheck}`,
                    },
                    {
                      ok: kpis.pendingEntries === 0,
                      label: kpis.pendingEntries === 0 ? 'Aucune écriture en attente' : `${kpis.pendingEntries} écriture(s) à valider`,
                      sub: 'Brouillons comptables',
                    },
                    {
                      ok: ratios.netMargin >= 0,
                      label: ratios.netMargin >= 0 ? 'Résultat positif' : 'Résultat déficitaire',
                      sub: `Marge: ${ratios.netMargin}%`,
                    },
                  ].map((alert, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-3 p-3 rounded-lg text-xs",
                      alert.ok ? 'bg-emerald-50' : 'bg-amber-50'
                    )}>
                      {alert.ok
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className={cn("font-bold", alert.ok ? 'text-emerald-700' : 'text-amber-700')}>{alert.label}</p>
                        <p className="text-slate-400">{alert.sub}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            /* Encart simplifié pour AIDE_COMPTABLE */
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  État de votre activité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={cn(
                  "flex items-start gap-3 p-3 rounded-lg text-xs",
                  systemHealth.isBalanced ? 'bg-emerald-50' : 'bg-amber-50'
                )}>
                  {systemHealth.isBalanced
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={cn("font-bold", systemHealth.isBalanced ? 'text-emerald-700' : 'text-amber-700')}>
                      {systemHealth.isBalanced ? 'Écritures équilibrées' : 'Déséquilibre détecté'}
                    </p>
                    <p className="text-slate-400">Vérifié à {systemHealth.lastCheck}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg text-xs bg-blue-50">
                  <FileClock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-700">
                      {kpis.pendingEntries > 0
                        ? `${kpis.pendingEntries} brouillon(s) en attente`
                        : 'Aucun brouillon en attente'}
                    </p>
                    <p className="text-slate-400">Vos saisies non encore validées</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg text-xs bg-slate-50">
                  <Activity className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-700">Période : {activePeriodCode}</p>
                    <p className="text-slate-400">{kpis.totalEntries} écriture(s) enregistrée(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
