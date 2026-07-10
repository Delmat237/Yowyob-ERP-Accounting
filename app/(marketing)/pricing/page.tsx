import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: 'Tarifs | KSM',
  description: 'Des offres simples et transparentes pour la solution comptable generale et analytique pour la zone OHADA KSM.',
};

const plans = [
  {
    name: 'Starter',
    price: 'Gratuit',
    period: '',
    description: 'Pour découvrir KSM et gérer une petite structure comptable generale et analytique.',
    features: [
      '1 organisation',
      'Plan comptable SYSCOHADA',
      "Jusqu'à 2 utilisateurs",
      'États financiers de base',
      'Support communautaire',
    ],
    cta: 'Commencer',
    highlighted: false,
  },
  {
    name: 'Business',
    price: '25 000',
    period: 'FCFA / mois',
    description: 'Pour les PME qui veulent automatiser leur comptabilité generale et analytique.',
    features: [
      'Organisations illimitées',
      'OCR & comptabilisation auto',
      'Utilisateurs illimités',
      'Rôles comptables granulaires',
      'Intégration caisse & facturation',
      'Support prioritaire',
    ],
    cta: 'Essayer Business',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    period: '',
    description: 'Pour les groupes avec besoins spécifiques et déploiement dédié.',
    features: [
      'Tout le plan Business',
      'Déploiement local ou cloud privé',
      'Intégrations sur mesure',
      'Accompagnement dédié',
      'SLA & support 24/7',
    ],
    cta: "Contacter l'équipe",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        icon={Tag}
        eyebrow="Tarifs"
        title="Des tarifs simples et transparents"
        description="Choisissez l'offre adaptée à votre structure. Sans licence par module, sans frais cachés."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`flex flex-col border-0 shadow-md ${
                  plan.highlighted ? 'ring-2 ring-blue-600 shadow-xl' : ''
                }`}
              >
                <CardHeader className="text-center pb-2">
                  {plan.highlighted && (
                    <span className="inline-block mx-auto mb-3 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                      Le plus populaire
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 mb-8 mt-4 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    <Link href="/contact">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Les tarifs sont indicatifs et peuvent évoluer. Contactez-nous pour un devis adapté.
          </p>
        </div>
      </section>
    </>
  );
}
