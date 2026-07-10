import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Rocket, Settings2, ScanLine, BarChart3, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: 'Documentation | KSM',
  description: 'Guides et références pour prendre en main la solution comptable generale et analytique africaine KSM.',
};  

const sections = [
  {
    icon: Rocket,
    title: 'Démarrage rapide',
    description: 'Créez votre organisation, configurez votre exercice et saisissez votre première écriture.',
  },
  {
    icon: Settings2,
    title: 'Configuration comptable',
    description: 'Plan comptable, journaux, taxes, devises et modes de paiement.',
  },
  {
    icon: ScanLine,
    title: 'OCR & comptabilisation',
    description: 'Importez une facture, vérifiez l\'extraction et générez l\'écriture automatiquement.',
  },
  {
    icon: BarChart3,
    title: 'États & rapports',
    description: 'Bilan, compte de résultat, balance, grand livre et exports.',
  },
  {
    icon: ShieldCheck,
    title: 'Rôles & permissions',
    description: 'Attribuez les rôles comptables et gérez les accès par organisation.',
  },
  {
    icon: BookOpen,
    title: 'Référence API',
    description: 'Endpoints REST, authentification et webhooks pour vos intégrations.',
  },
];

export default function DocsPage() {
  return (
    <>
      <PageHero
        icon={BookOpen}
        eyebrow="Support"
        title="Documentation"
        description="Tout ce qu'il faut pour configurer KSM et tirer parti de chaque fonctionnalité."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section) => (
              <Card key={section.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <section.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">{section.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Vous ne trouvez pas votre réponse&nbsp;?{' '}
            <Link href="/help" className="text-blue-600 hover:underline">
              Consultez le centre d&apos;aide
            </Link>{' '}
            ou{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contactez-nous
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
