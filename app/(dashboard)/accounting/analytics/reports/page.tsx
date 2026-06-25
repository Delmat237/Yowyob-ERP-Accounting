"use client";

import React from 'react';
import Link from 'next/link';
import { BarChart3, BookOpen, ClipboardCheck, Layers, ArrowRight } from 'lucide-react';
import { PermissionGuard } from '@/components/auth/permission-guard';

// Synthèse des rapports de la comptabilité analytique. Regroupe les accès
// aux états analytiques (par axe, budgétaire) et renvoie vers les vues dédiées.
const reports = [
    {
        title: 'Grand Livre Analytique',
        description: 'Écritures ventilées par axe et compte analytique.',
        href: '/accounting/analytics/ledger',
        icon: BookOpen,
    },
    {
        title: 'Répartition par Axe',
        description: 'Charges et produits agrégés par axe analytique.',
        href: '/accounting/analytics',
        icon: Layers,
    },
    {
        title: 'Suivi Budgétaire',
        description: 'Comparaison budget prévu / réalisé par poste.',
        href: '/accounting/budgets',
        icon: BarChart3,
    },
    {
        title: 'Validation des Budgets',
        description: 'État des budgets soumis, validés ou rejetés.',
        href: '/accounting/budget-validation',
        icon: ClipboardCheck,
    },
];

export default function AnalyticalReportsPage() {
    return (
        <div className="bg-gray-50/50 min-h-full">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-xl bg-indigo-100 p-3">
                        <BarChart3 className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Rapports Analytiques
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Synthèse des états de la comptabilité analytique et du suivi budgétaire.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <PermissionGuard
                    feature="analytics"
                    action="read"
                    fallback={
                        <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400 text-sm">
                            Vous n'avez pas la permission de consulter ces rapports.
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {reports.map((report) => (
                            <Link
                                key={report.href}
                                href={report.href}
                                className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
                            >
                                <div className="flex-shrink-0 rounded-lg bg-indigo-50 p-3">
                                    <report.icon className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-1">
                                        {report.title}
                                        <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">{report.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </PermissionGuard>
            </div>
        </div>
    );
}
