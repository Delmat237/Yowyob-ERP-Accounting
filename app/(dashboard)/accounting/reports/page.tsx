"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Download,
  RefreshCw,
  FileText,
  BarChart3,
  BookOpen,
  Scale,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface ReportCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

function ReportCard({ title, description, href, icon, color }: ReportCardProps) {
  return (
    <Link href={href} prefetch={false}>
      <Card className="hover:shadow-md transition-all group border-l-4" style={{ borderLeftColor: color }}>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="p-2 rounded-lg bg-gray-50 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AccountingReportsPage() {
  return (
    <div className="min-h-screen p-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Centre de Rapports</h1>
          <p className="text-gray-500 mt-2">Accédez à l'ensemble de vos états financiers et analyses d'audit.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReportCard
            title="Bilan"
            description="Visualisez l'état du patrimoine de l'entreprise (Actifs vs Passifs) à un instant T."
            href="/analyse/balance-sheet"
            icon={<Scale className="h-6 w-6 text-blue-600" />}
            color="#2563eb"
          />
          <ReportCard
            title="Compte de Résultat"
            description="Analysez la performance de votre activité, les produits générés et les charges consommées."
            href="/analyse/profit-and-loss"
            icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
            color="#059669"
          />
          <ReportCard
            title="Grand Livre"
            description="Détail exhaustif de tous les mouvements par compte comptable sur une période donnée."
            href="/analyse/generale-ledger"
            icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
            color="#4f46e5"
          />
          <ReportCard
            title="Balance des Comptes"
            description="Vérification de l'équilibre entre les débits et les crédits pour chaque compte."
            href="/analyse/generale-balance"
            icon={<BarChart3 className="h-6 w-6 text-amber-600" />}
            color="#d97706"
          />
          <PermissionGuard feature="audit_log" action="read">
            <ReportCard
              title="Journal d'Audit"
              description="Tracez toutes les actions effectuées dans le système pour une transparence totale."
              href="/analyse/audits"
              icon={<ShieldCheck className="h-6 w-6 text-red-600" />}
              color="#dc2626"
            />
          </PermissionGuard>
          <ReportCard
            title="Flux de Trésorerie"
            description="Suivez les entrées et sorties de cash réelles par nature d'activité."
            href="/analyse/cache-flow"
            icon={<Wallet className="h-6 w-6 text-purple-600" />}
            color="#9333ea"
          />
          {/* <ReportCard 
            title="Tableau de Bord Exécutif"
            description="Vision synthétique des indicateurs clés de performance (KPI)."
            href="/analyse/executive-summary"
            icon={<FileText className="h-6 w-6 text-gray-600" />}
            color="#4b5563"
          /> */}
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Fonctionnalités avancées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-blue-50">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Export Multi-Format</p>
                <p>Tous les rapports peuvent être exportés en PDF pour vos présentations ou en XLSX pour vos retraitements.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-emerald-50">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Temps Réel</p>
                <p>Les données sont calculées instantanément lors de la génération pour refléter vos dernières saisies.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}