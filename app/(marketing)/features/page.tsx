import type { Metadata } from 'next';
import {
  BookOpen,
  Calculator,
  Users,
  TrendingUp,
  Shield,
  Zap,
  ScanLine,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: 'Fonctionnalités | KSM',
  description: "Découvrez l'ensemble des fonctionnalités de la solution comptable generale et analytique africaine KSM.",
};

const features = [
  {
    icon: BookOpen,
    title: 'Comptabilité Générale',
    description:
      'Plan comptable SYSCOHADA natif, écritures, journaux et lettrage avec automatisation intelligente.',
  },
  {
    icon: ScanLine,
    title: 'OCR & Comptabilisation auto',
    description:
      "Numérisez vos factures : l'OCR extrait les montants et génère automatiquement l'écriture comptable.",
  },
  {
    icon: Calculator,
    title: 'États Financiers',
    description:
      'Bilan, compte de résultat et balance générés en temps réel, conformes au référentiel OHADA.',
  },
  {
    icon: Users,
    title: 'Gestion des Tiers',
    description:
      'Comptes clients (411) et fournisseurs (401) auto-assignés et synchronisés avec vos partenaires.',
  },
  {
    icon: Building2,
    title: 'Multi-organisation',
    description:
      'Gérez plusieurs entités et exercices depuis un seul espace, avec isolation des données par organisation.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Rapports & Analyses',
    description:
      'Grand livre, balance âgée, flux de trésorerie et tableaux de bord exportables.',
  },
  {
    icon: Shield,
    title: 'Rôles & Sécurité',
    description:
      "Contrôle d'accès granulaire (consultation, gestion, supervision) et traçabilité des opérations.",
  },
  {
    icon: TrendingUp,
    title: 'Pilotage Business',
    description:
      "Indicateurs de performance pour suivre la santé financière et anticiper les besoins de trésorerie.",
  },
  {
    icon: Zap,
    title: 'Performance',
    description:
      'Interface rapide et réactive, déployable en local ou dans le cloud selon vos contraintes.',
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        icon={BookOpen}
        eyebrow="Produit"
        title="Toutes les fonctionnalités KSM"
        description="Une suite comptable complète, pensée pour la réglementation OHADA et la réalité des entreprises africaines."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
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
    </>
  );
}
