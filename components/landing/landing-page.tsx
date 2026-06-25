"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
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
import { useRedirectIfAuthenticated } from '@/hooks/use-auth-redirect';

export function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Si l'utilisateur est déjà connecté, il ne doit pas voir la landing :
  // redirection immédiate vers le dashboard.
  const guestStatus = useRedirectIfAuthenticated();

  // Vérification en cours ou redirection : on n'affiche pas la landing
  // (évite un flash de la page publique pour un utilisateur connecté).
  if (guestStatus !== 'allowed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  const features = [
    {
      icon: BookOpen,
      title: "Comptabilité Générale",
      description: "Gestion complète de votre plan comptable, écritures et journaux avec automatisation intelligente."
    },
    {
      icon: Calculator,
      title: "États Financiers",
      description: "Génération automatique de bilans, comptes de résultat et balances en temps réel."
    },
    {
      icon: Users,
      title: "Gestion des Tiers",
      description: "Suivi détaillé de vos comptes clients et fournisseurs pour une maîtrise parfaite de vos flux."
    },
    {
      icon: TrendingUp,
      title: "Croissance Business",
      description: "Outils d'analyse pour identifier les opportunités de croissance et optimiser vos performances."
    },
    {
      icon: Shield,
      title: "Sécurité Avancée",
      description: "Protection des données avec cryptage et contrôles d'accès multi-niveaux."
    },
    {
      icon: Zap,
      title: "Performance Optimale",
      description: "Interface rapide et réactive pour une productivité maximale de vos équipes."
    }
  ];

  const stats = [
    { number: "99.9%", label: "Disponibilité" },
    { number: "500+", label: "Entreprises" },
    { number: "2M+", label: "Transactions" },
    { number: "24/7", label: "Support" }
  ];

  // Comparaison KSM vs solutions existantes du marché.
  // valeur possible : true (inclus), false (absent), 'partial' (limité / payant)
  const comparison = [
    {
      feature: "Plan comptable OHADA / SYSCOHADA natif",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Comptabilisation automatique (OCR de factures)",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Multi-tenant & multi-organisation natif",
      ksm: true,
      odoo: 'partial',
      classic: false,
    },
    {
      feature: "Intégration caisse / facturation temps réel",
      ksm: true,
      odoo: true,
      classic: false,
    },
    {
      feature: "Rôles comptables granulaires (SUPERVISE / MANAGE)",
      ksm: true,
      odoo: 'partial',
      classic: 'partial',
    },
    {
      feature: "Déploiement local ou cloud, sans licence par module",
      ksm: true,
      odoo: false,
      classic: false,
    },
    {
      feature: "Onboarding comptable en self-service",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">KSM</h1>
                <p className="text-xs text-gray-500">Solution Comptable</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Fonctionnalités
              </a>
              <a href="#comparison" className="text-gray-600 hover:text-blue-600 transition-colors">
                Solutions
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                Tarifs
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </a>
              <Button
                onClick={() => setIsLoginOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Se connecter
              </Button>
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
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  Tarifs
                </a>
                <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
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
                {" "}Gestion Comptable
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              KSM vous offre une suite complète d&apos;outils pour gérer efficacement votre comptabilité,
              vos flux financiers et vos rapports. Simplifiez votre gestion financière avec notre solution tout-en-un.
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
              className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
            >
              Contacter l&apos;équipe
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir KSM&nbsp;?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comparé aux solutions existantes comme Odoo ou les logiciels comptables
              classiques, KSM est pensé pour le contexte et la réglementation OHADA.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-5 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Fonctionnalité
                  </th>
                  <th className="py-5 px-6 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-lg font-bold text-blue-600">KSM</span>
                      <span className="text-xs text-gray-500">Notre solution</span>
                    </div>
                  </th>
                  <th className="py-5 px-6 text-center text-base font-semibold text-gray-700">
                    Odoo
                  </th>
                  <th className="py-5 px-6 text-center text-base font-semibold text-gray-700">
                    Solutions classiques
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, index) => (
                  <tr
                    key={index}
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
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        <ComparisonCell value={row.classic} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Légende */}
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">KSM</span>
              </div>
              <p className="text-gray-400 text-sm">
                Solution complète pour maîtriser votre gestion comptable.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Centre d&apos;aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Presse</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 KSM. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
