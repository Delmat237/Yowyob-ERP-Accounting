import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, Mail, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: "Centre d'aide | KSM",
  description: 'Questions fréquentes et canaux de support de la solution comptable generale et analytique africaine KSM.',
};

const faqs = [
  {
    question: 'Comment créer ma première organisation ?',
    answer:
      "Après connexion, l'assistant de configuration vous guide en 5 étapes : organisation, exercice, plan comptable, journaux et premier utilisateur.",
  },
  {
    question: 'KSM est-il conforme au référentiel OHADA ?',
    answer:
      'Oui. Le plan comptable SYSCOHADA est intégré nativement, ainsi que les états financiers correspondants (bilan, compte de résultat, balance).',
  },
  {
    question: 'Puis-je importer mes factures automatiquement ?',
    answer:
      "Oui. L'OCR extrait les informations de vos factures et propose une écriture comptable que vous validez en un clic.",
  },
  {
    question: 'Comment gérer les droits de mes collaborateurs ?',
    answer:
      'Des rôles comptables granulaires (consultation, gestion, supervision) sont attribuables par organisation depuis la page de gestion des rôles.',
  },
  {
    question: 'Mes données sont-elles isolées par organisation ?',
    answer:
      "Oui. L'architecture multi-tenant garantit l'isolation des données entre tenants et organisations.",
  },
];

const channels = [
  {
    icon: Mail,
    title: 'Par e-mail',
    description: 'Écrivez-nous, réponse sous 24h ouvrées.',
    href: '/contact',
    cta: 'Nous écrire',
  },
  {
    icon: MessageCircle,
    title: 'Documentation',
    description: 'Guides détaillés et référence API.',
    href: '/docs',
    cta: 'Lire la doc',
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        icon={LifeBuoy}
        eyebrow="Support"
        title="Centre d'aide"
        description="Trouvez rapidement une réponse à vos questions ou contactez notre équipe."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            {channels.map((channel) => (
              <Card key={channel.title} className="border-0 shadow-md">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <channel.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {channel.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{channel.description}</p>
                  <Button asChild variant="outline">
                    <Link href={channel.href}>{channel.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-medium text-gray-900 flex justify-between items-center">
                  {faq.question}
                  <span className="text-blue-600 transition-transform group-open:rotate-45 text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
