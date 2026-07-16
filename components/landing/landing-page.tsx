"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Users,
  TrendingUp,
  Shield, 
  Zap,
  ArrowRight,
  Menu,
  X,
  Calculator,
  Check,
  Minus
} from 'lucide-react';
import { LoginModal } from './login-modal';
import { AppGridPopup } from '@/components/layout/app-grid-popup';
import { SiteFooter } from '@/components/marketing/site-footer';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth-redirect';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { YowyobLogo } from '@/components/brand/yowyob-logo';

export function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Si l'utilisateur est déjà connecté, il ne doit pas voir la landing :
  // redirection immédiate vers le dashboard.
  const guestStatus = useRedirectIfAuthenticated();

  // Vérification en cours ou redirection : on n'affiche pas la landing
  // (évite un flash de la page publique pour un utilisateur connecté).
  if (guestStatus !== 'allowed') {
    return <CustomPageLoader message="Vérification de la session..." />;
  }

  const features = [
    {
      icon: BookOpen,
      title: "Comptabilité Générale",
      description: "Plan comptable, écritures, journaux, validation des pièces, exercices et périodes — avec saisie semi-automatique."
    },
    {
      icon: Calculator,
      title: "Comptabilité Analytique",
      description: "Axes, centres d'analyse, ventilation, coûts complets et partiels, budgets et concordance avec la comptabilité générale."
    },
    {
      icon: TrendingUp,
      title: "États Financiers",
      description: "Bilan, compte de résultat, grand livre, balance générale, flux de trésorerie et rapports analytiques."
    },
    {
      icon: Users,
      title: "Gestion des Tiers",
      description: "Suivi des comptes clients et fournisseurs, factures, paiements et produits pour maîtriser vos flux."
    },
    {
      icon: Shield,
      title: "Sécurité et Rôles",
      description: "Aide-comptable, comptable et responsable comptable — avec journal d'audit et contrôles d'accès."
    },
    {
      icon: Zap,
      title: "Multi-agence et Modularité",
      description: "Plusieurs agences isolées, modules souscriptibles à la carte et ouverture aux autres applications."
    }
  ];

  const stats = [
    { number: "Garantie", label: "Disponibilité & support" },
    { number: "500+", label: "Entreprises" },
    { number: "2M+", label: "Transactions" },
    { number: "24/7", label: "Support" }
  ];

  // Comparaison KSM vs solutions existantes du marché.
  // valeur possible : true (inclus), false (absent), 'partial' (limité / payant)
  const comparison = [
    {
      feature: "Plan comptable conforme OHADA et SYSCOHADA",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Multi-agence native (agences et succursales isolées)",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Écritures comptables, journaux et opérations",
      ksm: true,
      odoo: true,
      classic: 'partial',
    },
    {
      feature: "Saisie semi-automatique des écritures",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Validation des écritures par le responsable comptable",
      ksm: true,
      odoo: 'partial',
      classic: 'partial',
    },
    {
      feature: "Exercices comptables et périodes de clôture",
      ksm: true,
      odoo: true,
      classic: 'partial',
    },
    {
      feature: "Bilan, compte de résultat et balance générale",
      ksm: true,
      odoo: true,
      classic: 'partial',
    },
    {
      feature: "Grand livre, flux de trésorerie et résumé exécutif",
      ksm: true,
      odoo: true,
      classic: 'partial',
    },
    {
      feature: "Journal d'audit des opérations comptables",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Pack fiscalité OHADA intégré",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Gestion des clients, fournisseurs, factures et paiements",
      ksm: true,
      odoo: true,
      classic: 'partial',
    },
    {
      feature: "Comptabilisation assistée par reconnaissance de factures",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Plusieurs organisations sur une même plateforme",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Modules comptables souscriptibles à la carte (générale, analytique)",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Autres applications peuvent souscrire à la comptabilité comme service",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Intégration caisse et facturation en temps réel",
      ksm: true,
      odoo: true,
      classic: false,
    },
    {
      feature: "Rôles dédiés : aide-comptable, comptable, responsable comptable",
      ksm: true,
      odoo: 'partial',
      classic: 'partial',
    },
    {
      feature: "Initialisation comptable en autonomie",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Déploiement local ou cloud, sans licence par module",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Coût total adapté au marché africain",
      ksm: true,
      odoo: false,
      classic: 'partial',
    },
  ];

  const analyticComparison = [
    {
      feature: "Plan analytique et comptes analytiques",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Axes analytiques et centres d'analyse",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Charges analytiques et imputation sur les écritures",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Ventilation analytique des charges",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Coûts complets et coûts partiels",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Imputation rationnelle des charges indirectes",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Coûts préétablis et coûts standards",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Unités d'œuvre et incorporations",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Valorisation des stocks et méthodes de calcul des coûts",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Prix de cessions entre centres d'analyse",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Budget analytique en brouillon avec validation par le responsable",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Suivi budgétaire et validation des budgets",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Balance par compte analytique",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "États et rapports analytiques dédiés",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Concordance comptabilité générale et comptabilité analytique",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Écritures analytiques autonomes (saisie manuelle ou import comptabilité générale)",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Journaux analytiques configurables (type, centre source, reflet)",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Virements inter-centres avec imputation négative / positive",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Contrôle budgétaire en temps réel à la saisie",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Validation des écritures analytiques en brouillon",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Abonnement à la comptabilité analytique seule, sans activer la comptabilité générale",
      ksm: true,
      odoo: false,
      classic: false,
    },
  ];

  const ComparisonCell = ({ value }: { value: boolean | string }) => {
    if (value === true) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100">
          <Check className="h-4 w-4 text-green-600" />
        </span>
      );
    }
    if (value === 'partial') {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100">
          <Minus className="h-4 w-4 text-amber-600" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100">
        <X className="h-4 w-4 text-red-500" />
      </span>
    );
  };

  const ComparisonLegend = () => (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
          <Check className="h-3 w-3 text-green-600" />
        </span>
        Inclus
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100">
          <Minus className="h-3 w-3 text-amber-600" />
        </span>
        Limité / payant en option
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
          <X className="h-3 w-3 text-red-500" />
        </span>
        Non disponible
      </span>
    </div>
  );

  const renderComparisonTable = (
    rows: typeof comparison,
    options?: { highlightClassic?: boolean },
  ) => (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-5 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Fonctionnalité
            </th>
            <th className="py-5 px-6 text-center">
              <div className="inline-flex flex-col items-center gap-1">
                <YowyobLogo size="sm" imageClassName="mx-auto" />
                <span className="text-xs text-gray-500">ACCOUNTING</span>
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                  Système ERP
                </span>
              </div>
            </th>
            <th className="py-5 px-6 text-center">
              <div className="inline-flex flex-col items-center gap-1">
                <span className="text-base font-semibold text-gray-700">Odoo</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                  Plateforme ERP
                </span>
              </div>
            </th>
            {options?.highlightClassic !== false && (
              <th className="py-5 px-6 text-center text-base font-semibold text-gray-700">
                Solutions classiques
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.feature}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              <td className="py-4 px-6 text-sm text-gray-800 font-medium">
                {row.feature}
              </td>
              <td className="py-4 px-6 text-center bg-blue-50/50">
                <div className="flex justify-center">
                  <ComparisonCell value={row.ksm} />
                </div>
              </td>
              <td className="py-4 px-6 text-center">
                <div className="flex justify-center">
                  <ComparisonCell value={row.odoo} />
                </div>
              </td>
              {options?.highlightClassic !== false && (
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center">
                    <ComparisonCell value={row.classic} />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <YowyobLogo size="md" showSubtitle subtitle="ACCOUNTING" priority />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Fonctionnalités
              </a>
              <a href="#comparison" className="text-gray-600 hover:text-blue-600 transition-colors">
                Solutions
              </a>
              <a href="#comparison-analytique" className="text-gray-600 hover:text-blue-600 transition-colors">
                Analytique
              </a>
              <a href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                Tarifs
              </a>
              <a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </a>
              <Button
                onClick={() => setIsLoginOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Se connecter
              </Button>
              {/* Lanceur de plateformes KSM (« gaufre ») — dernier élément, visible même déconnecté */}
              <AppGridPopup />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  Fonctionnalités
                </a>
                <a href="#comparison" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  Solutions
                </a>
                <a href="#comparison-analytique" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  Analytique
                </a>
                <a href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  Tarifs
                </a>
                <a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  Contact
                </a>
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white mx-3"
                >
                  Se connecter
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight">
              Maîtrisez votre
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}Gestion Comptable generale et analytique
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              KSM est un <span className="font-semibold text-gray-800">système ERP</span> constitué de plusieurs
              plateformes, parmi lesquelles <span className="font-semibold text-blue-600">Accounting</span>, qui vous
              permet de gérer votre comptabilité générale et analytique, vos flux financiers et vos rapports —
              dans une solution intégrée, prête à l&apos;emploi.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setIsLoginOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
              >
                Voir la démo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Avancées
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les outils qui vous aideront à développer votre activité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à révolutionner votre entreprise ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Rejoignez des centaines d&apos;entreprises qui font déjà confiance à KSM
            pour optimiser leur gestion comptable et financière.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setIsLoginOpen(true)}
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
            >
              Démarrer maintenant
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white px-8 py-3 text-lg"
            >
              <Link href="/contact">Contacter l&apos;équipe</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comptabilité générale&nbsp;: KSM vs Odoo
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plan comptable, écritures, états financiers, multi-agence et modularité —
              une comptabilité générale pensée pour la réglementation OHADA.
            </p>
            <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto">
              Là où Odoo est une <span className="font-semibold text-gray-700">plateforme ERP</span> à
              configurer et assembler, KSM est un <span className="font-semibold text-blue-600">système ERP</span> intégré,
              prêt à l&apos;emploi et conforme dès le départ.
            </p>
          </div>

          {renderComparisonTable(comparison)}
          <ComparisonLegend />
        </div>
      </section>

      {/* Analytic Accounting Comparison */}
      <section id="comparison-analytique" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comptabilité analytique&nbsp;: KSM vs Odoo
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Axes, centres d&apos;analyse, coûts, budgets et concordance avec la
              comptabilité générale — chaque organisation peut souscrire uniquement
              à la comptabilité analytique, sans activer les autres modules.
            </p>
          </div>

          {renderComparisonTable(analyticComparison)}
          <ComparisonLegend />
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
