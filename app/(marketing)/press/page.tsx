import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: 'Presse | KSM',
  description: 'Ressources presse, communiqués et kit média de KSM.',
};

const releases = [
  {
    date: '15 juin 2026',
    title: 'KSM lance sa comptabilisation automatique par OCR',
    excerpt:
      "La nouvelle fonctionnalité permet de transformer une facture en écriture comptable conforme OHADA en un clic.",
  },
  {
    date: '2 mai 2026',
    title: 'KSM dépasse les 500 entreprises utilisatrices',
    excerpt:
      'La solution comptable continue sa croissance auprès des PME de la zone OHADA.',
  },
  {
    date: '10 mars 2026',
    title: 'Intégration native caisse et facturation',
    excerpt:
      "Les encaissements et factures se comptabilisent désormais automatiquement en temps réel.",
  },
];

export default function PressPage() {
  return (
    <>
      <PageHero
        icon={Newspaper}
        eyebrow="Entreprise"
        title="Espace presse"
        description="Communiqués, actualités et ressources média à propos de KSM."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Communiqués récents</h2>
          <div className="space-y-4 mb-16">
            {releases.map((release) => (
              <article
                key={release.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
                  {release.date}
                </p>
                <h3 className="text-lg font-semibold text-gray-900">{release.title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{release.excerpt}</p>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Kit média</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Logos, captures d&apos;écran et éléments de marque KSM.
                </p>
                <Button asChild variant="outline">
                  <Link href="/contact">Demander le kit</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Contact presse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Une demande d&apos;interview ou d&apos;information&nbsp;?
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/contact">Nous contacter</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
