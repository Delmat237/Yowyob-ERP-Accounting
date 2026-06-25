import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, Webhook, KeyRound, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';

export const metadata: Metadata = {
  title: 'API & Développeurs | KSM',
  description: "Intégrez KSM à vos systèmes grâce à son API REST et ses webhooks.",
};

const capabilities = [
  {
    icon: Code2,
    title: 'API REST',
    description:
      'Exposez et manipulez vos écritures, comptes, journaux et exercices via une API REST documentée.',
  },
  {
    icon: Webhook,
    title: 'Webhooks & événements',
    description:
      "Réagissez en temps réel aux événements métier (facture émise, paiement encaissé, écriture postée).",
  },
  {
    icon: KeyRound,
    title: 'Authentification sécurisée',
    description:
      'Jetons JWT validés via JWKS, en-têtes X-Tenant-Id / X-Organization-Id pour le multi-tenant.',
  },
  {
    icon: Boxes,
    title: 'Intégrations',
    description:
      'Connectez votre caisse, votre facturation ou votre ERP : la comptabilisation se déclenche automatiquement.',
  },
];

const sampleRequest = `# Lister les écritures d'un exercice
curl https://accounting.yowyob.com/accounting-api/api/accounting/entries \\
  -H "Authorization: Bearer <token>" \\
  -H "X-Tenant-Id: <tenant>" \\
  -H "X-Organization-Id: <org>"`;

export default function DevelopersPage() {
  return (
    <>
      <PageHero
        icon={Code2}
        eyebrow="API"
        title="Construisez avec l'API KSM"
        description="Une API REST pour automatiser votre comptabilité et l'intégrer à votre système d'information."
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {capabilities.map((cap) => (
              <Card key={cap.title} className="border-0 shadow-md">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <cap.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {cap.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{cap.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exemple de requête</h2>
            <pre className="bg-gray-900 text-gray-100 text-sm rounded-xl p-6 overflow-x-auto">
              <code>{sampleRequest}</code>
            </pre>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Besoin d&apos;un accès développeur ou d&apos;une clé d&apos;API&nbsp;?
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/contact">Demander un accès</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
