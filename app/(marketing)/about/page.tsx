import type { Metadata } from 'next';
import { Building2, Target, Eye, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: 'À propos | KSM',
  description: "Découvrez la mission et les valeurs de KSM, la solution comptable africaine.",
};

const values = [
  {
    icon: Target,
    title: 'Notre mission',
    description:
      "Rendre la comptabilité conforme à l'OHADA accessible, automatisée et abordable pour toutes les entreprises africaines.",
  },
  {
    icon: Eye,
    title: 'Notre vision',
    description:
      "Devenir la référence de la gestion financière sur le continent, du commerçant à la PME multi-entités.",
  },
  {
    icon: Heart,
    title: 'Nos valeurs',
    description:
      'Simplicité, fiabilité et proximité : des outils robustes pensés pour la réalité de nos utilisateurs.',
  },
];

const stats = [
  { number: '500+', label: 'Entreprises' },
  { number: '2M+', label: 'Transactions' },
  { number: 'Garantie', label: 'Disponibilité & support' },
  { number: '24/7', label: 'Support' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        icon={Building2}
        eyebrow="Entreprise"
        title="À propos de KSM"
        description="KSM est une solution de gestion comptable développée par Yowyob pour les entreprises de la zone OHADA."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {values.map((value) => (
              <Card key={value.title} className="border-0 shadow-md text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
