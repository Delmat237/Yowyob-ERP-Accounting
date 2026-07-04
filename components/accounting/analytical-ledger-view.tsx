"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
    BookOpen,
    TrendingUp,
    TrendingDown,
    Scale,
    X,
} from 'lucide-react';
import { useNationalCurrency } from '@/hooks/use-national-currency';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ENTRIES = [
    {
        id: 'e1',
        date: '2026-01-15',
        libelle: 'Facture Fournisseur',
        compteGeneral: '401',
        debit: 500000,
        credit: 0,
        solde: 500000,
        axeId: 'axe1',
        compteAnalytiqueId: 'ca1',
    },
    {
        id: 'e2',
        date: '2026-02-03',
        libelle: 'Paiement Client',
        compteGeneral: '411',
        debit: 0,
        credit: 300000,
        solde: 200000,
        axeId: 'axe2',
        compteAnalytiqueId: 'ca2',
    },
    {
        id: 'e3',
        date: '2026-03-10',
        libelle: 'Salaire',
        compteGeneral: '641',
        debit: 200000,
        credit: 0,
        solde: 400000,
        axeId: 'axe1',
        compteAnalytiqueId: 'ca3',
    },
];

const MOCK_AXES = [
    { id: 'axe1', libelle: 'Projet Alpha' },
    { id: 'axe2', libelle: 'Projet Beta' },
];

const MOCK_COMPTES_ANALYTIQUES = [
    { id: 'ca1', libelle: 'Développement' },
    { id: 'ca2', libelle: 'Marketing' },
    { id: 'ca3', libelle: 'Ressources Humaines' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number) {
    return value.toLocaleString('fr-FR');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticalLedgerView() {
    const { nationalCurrency } = useNationalCurrency();
    const currencyCode = nationalCurrency?.code ?? 'XAF';

    const [axeFilter, setAxeFilter] = useState<string>('');
    const [compteFilter, setCompteFilter] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const filtered = MOCK_ENTRIES.filter((e) => {
        const matchAxe = axeFilter ? e.axeId === axeFilter : true;
        const matchCompte = compteFilter ? e.compteAnalytiqueId === compteFilter : true;
        const matchFrom = dateFrom ? new Date(e.date) >= new Date(dateFrom) : true;
        const matchTo = dateTo ? new Date(e.date) <= new Date(dateTo) : true;
        return matchAxe && matchCompte && matchFrom && matchTo;
    });

    const totalDebit = filtered.reduce((s, e) => s + e.debit, 0);
    const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);
    const soldeNet = totalDebit - totalCredit;

    function handleReset() {
        setAxeFilter('');
        setCompteFilter('');
        setDateFrom('');
        setDateTo('');
    }

    return (
        <div className="space-y-5">
            {/* ── Filter bar ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Axe Analytique */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Axe Analytique
                        </label>
                        <Select value={axeFilter} onValueChange={setAxeFilter}>
                            <SelectTrigger className="border-slate-200 bg-slate-50/60 h-9 text-sm">
                                <SelectValue placeholder="Tous les axes" />
                            </SelectTrigger>
                            <SelectContent>
                                {MOCK_AXES.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.libelle}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Compte Analytique */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Compte Analytique
                        </label>
                        <Select value={compteFilter} onValueChange={setCompteFilter}>
                            <SelectTrigger className="border-slate-200 bg-slate-50/60 h-9 text-sm">
                                <SelectValue placeholder="Tous les comptes" />
                            </SelectTrigger>
                            <SelectContent>
                                {MOCK_COMPTES_ANALYTIQUES.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.libelle}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date début */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Date début
                        </label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="border-slate-200 bg-slate-50/60 h-9 text-sm"
                        />
                    </div>

                    {/* Date fin */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Date fin
                        </label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="border-slate-200 bg-slate-50/60 h-9 text-sm"
                        />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:text-slate-900"
                    >
                        <X className="h-3.5 w-3.5" />
                        Réinitialiser
                    </Button>
                </div>
            </div>

            {/* ── KPI summary bar ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Débit */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-emerald-100 p-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                            Total Débit
                        </p>
                        <p className="text-lg font-black font-mono text-emerald-700 leading-tight">
                            {fmt(totalDebit)}{' '}
                            <span className="text-xs font-semibold">{currencyCode}</span>
                        </p>
                    </div>
                </div>

                {/* Total Crédit */}
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-rose-100 p-2">
                        <TrendingDown className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                            Total Crédit
                        </p>
                        <p className="text-lg font-black font-mono text-rose-700 leading-tight">
                            {fmt(totalCredit)}{' '}
                            <span className="text-xs font-semibold">{currencyCode}</span>
                        </p>
                    </div>
                </div>

                {/* Solde net */}
                <div
                    className={`rounded-xl border p-4 flex items-center gap-3 ${
                        soldeNet >= 0
                            ? 'border-indigo-100 bg-indigo-50'
                            : 'border-amber-100 bg-amber-50'
                    }`}
                >
                    <div
                        className={`flex-shrink-0 rounded-lg p-2 ${
                            soldeNet >= 0 ? 'bg-indigo-100' : 'bg-amber-100'
                        }`}
                    >
                        <Scale
                            className={`h-5 w-5 ${
                                soldeNet >= 0 ? 'text-indigo-600' : 'text-amber-600'
                            }`}
                        />
                    </div>
                    <div>
                        <p
                            className={`text-xs font-semibold uppercase tracking-wider ${
                                soldeNet >= 0 ? 'text-indigo-600' : 'text-amber-600'
                            }`}
                        >
                            Solde Net
                        </p>
                        <p
                            className={`text-lg font-black font-mono leading-tight ${
                                soldeNet >= 0 ? 'text-indigo-700' : 'text-amber-700'
                            }`}
                        >
                            {fmt(soldeNet)}{' '}
                            <span className="text-xs font-semibold">{currencyCode}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-800 hover:bg-slate-800 border-0">
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                    Date
                                </TableHead>
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">
                                    Libellé
                                </TableHead>
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                    Compte Général
                                </TableHead>
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                    Axe
                                </TableHead>
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                    Compte Analytique
                                </TableHead>
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 text-right whitespace-nowrap">
                                    Débit ({currencyCode})
                                </TableHead>
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 text-right whitespace-nowrap">
                                    Crédit ({currencyCode})
                                </TableHead>
                                <TableHead className="text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 text-right whitespace-nowrap">
                                    Solde ({currencyCode})
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <BookOpen className="h-10 w-10 opacity-30" />
                                            <p className="text-sm font-medium">
                                                Aucune écriture ne correspond aux filtres
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((e, idx) => {
                                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';
                                    return (
                                        <TableRow
                                            key={e.id}
                                            className={`${rowBg} hover:bg-indigo-50/30 transition-colors border-slate-100`}
                                        >
                                            <TableCell className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                                                {format(new Date(e.date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="px-4 py-2.5 text-sm text-slate-800 font-medium">
                                                {e.libelle}
                                            </TableCell>
                                            <TableCell className="px-4 py-2.5 text-sm text-slate-700 font-mono">
                                                {e.compteGeneral}
                                            </TableCell>
                                            <TableCell className="px-4 py-2.5 text-sm text-slate-700">
                                                {MOCK_AXES.find((a) => a.id === e.axeId)?.libelle ?? '—'}
                                            </TableCell>
                                            <TableCell className="px-4 py-2.5 text-sm text-slate-700">
                                                {MOCK_COMPTES_ANALYTIQUES.find(
                                                    (c) => c.id === e.compteAnalytiqueId
                                                )?.libelle ?? '—'}
                                            </TableCell>
                                            <TableCell className="px-4 py-2.5 text-right font-mono text-sm text-emerald-600 font-semibold whitespace-nowrap">
                                                {e.debit > 0 ? fmt(e.debit) : '—'}
                                            </TableCell>
                                            <TableCell className="px-4 py-2.5 text-right font-mono text-sm text-rose-600 font-semibold whitespace-nowrap">
                                                {e.credit > 0 ? fmt(e.credit) : '—'}
                                            </TableCell>
                                            <TableCell
                                                className={`px-4 py-2.5 text-right font-mono text-sm font-semibold whitespace-nowrap ${
                                                    e.solde >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                                }`}
                                            >
                                                {fmt(e.solde)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer totals */}
                {filtered.length > 0 && (
                    <div className="bg-slate-900 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                        <span className="text-xs text-slate-400">
                            {filtered.length} écriture{filtered.length > 1 ? 's' : ''} affichée
                            {filtered.length > 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-6 text-xs font-mono font-black text-white">
                            <span>
                                Débit :{' '}
                                <span className="text-emerald-400">{fmt(totalDebit)}</span>
                            </span>
                            <span>
                                Crédit :{' '}
                                <span className="text-rose-400">{fmt(totalCredit)}</span>
                            </span>
                            <span>
                                Solde :{' '}
                                <span className={soldeNet >= 0 ? 'text-indigo-300' : 'text-amber-400'}>
                                    {fmt(soldeNet)}
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
