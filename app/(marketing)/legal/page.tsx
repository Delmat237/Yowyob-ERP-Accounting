import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Cookie, FileText, Scale, ShieldCheck } from 'lucide-react';
import { legalDocumentList } from '@/lib/legal-documents';

const icons = {
  terms: FileText,
  privacy: ShieldCheck,
  cookies: Cookie,
} as const;

export const metadata: Metadata = {
  title: 'Légal | KSM',
  description: 'Documents juridiques KSM : conditions, confidentialité et cookies.',
};

export default function LegalPage() {
  return (
    <section className="bg-[#f5f5f5] py-12 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-2 text-gray-500">
          <Scale className="h-5 w-5" />
          <p className="text-sm font-semibold uppercase tracking-wider">Légal</p>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Légal</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
          Consultez les documents juridiques applicables à KSM — Kit Suite Manager, version bêta
          publiée.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {legalDocumentList.map((item) => {
            const Icon = icons[item.slug];

            return (
              <article
                key={item.slug}
                className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
                <Link
                  href={`/${item.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                >
                  Lire
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
