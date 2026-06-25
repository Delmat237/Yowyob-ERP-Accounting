import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: 'Carrières | KSM',
  description: "Rejoignez l'équipe KSM et construisez la comptabilité de demain en Afrique.",
};

const openings = [
  {
    title: 'Ingénieur Backend (Java / Spring)',
    location: 'Yaoundé / Télétravail',
    type: 'CDI',
    description: 'Concevez les microservices comptables et les intégrations du kernel.',
  },
  {
    title: 'Développeur Frontend (React / Next.js)',
    location: 'Yaoundé / Télétravail',
    type: 'CDI',
    description: "Construisez l'expérience utilisateur de la suite comptable.",
  },
  {
    title: 'Expert-comptable produit',
    location: 'Yaoundé',
    type: 'CDI',
    description: 'Garantissez la conformité OHADA et guidez la feuille de route fonctionnelle.',
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        icon={Briefcase}
        eyebrow="Entreprise"
        title="Rejoignez-nous"
        description="Nous recrutons des talents qui veulent simplifier la gestion financière des entreprises africaines."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Postes ouverts</h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <div
                key={job.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {job.type}
                    </span>
                  </div>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                  <Link href="/contact">Postuler</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-blue-50 rounded-2xl p-8">
            <p className="text-gray-700 mb-4">
              Aucun poste ne correspond&nbsp;? Envoyez-nous une candidature spontanée.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/contact">Candidature spontanée</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
