import fs from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  legalDocumentList,
  legalDocuments,
  type LegalDocumentSlug,
} from '@/lib/legal-documents';
import { PageHero } from '@/components/marketing/page-hero';

interface LegalDocumentViewProps {
  slug: LegalDocumentSlug;
}

async function readLegalText(fileName: string) {
  const filePath = path.join(process.cwd(), 'public', 'legal', fileName);
  return fs.readFile(filePath, 'utf8');
}

function lineKind(line: string) {
  if (line.includes(' || ')) return 'table';
  if (line.startsWith('• ')) return 'bullet';
  if (/^(Partie|Part|Annexe|Annex|End of document|Fin du document)/.test(line)) return 'major';
  if (/^\d+\.\s/.test(line)) return 'section';
  return 'paragraph';
}

function renderLine(line: string, index: number) {
  const kind = lineKind(line);

  if (kind === 'table') {
    const cells = line.split(' || ');

    return (
      <div
        key={`${index}-${line.slice(0, 16)}`}
        className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm sm:grid-cols-[minmax(160px,0.8fr)_minmax(0,1.2fr)_minmax(0,1.4fr)]"
      >
        {cells.map((cell, cellIndex) => (
          <div
            key={`${cellIndex}-${cell.slice(0, 12)}`}
            className={cellIndex === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}
          >
            {cell}
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'major') {
    return (
      <h2 key={`${index}-${line}`} className="pt-8 text-2xl font-bold text-gray-950">
        {line}
      </h2>
    );
  }

  if (kind === 'section') {
    return (
      <h3 key={`${index}-${line}`} className="pt-6 text-xl font-semibold text-gray-900">
        {line}
      </h3>
    );
  }

  if (kind === 'bullet') {
    return (
      <p key={`${index}-${line.slice(0, 16)}`} className="pl-5 text-gray-700 leading-7">
        {line}
      </p>
    );
  }

  return (
    <p key={`${index}-${line.slice(0, 16)}`} className="text-gray-700 leading-7">
      {line}
    </p>
  );
}

export async function LegalDocumentView({ slug }: LegalDocumentViewProps) {
  const document = legalDocuments[slug];
  const text = await readLegalText(document.textFile);
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const Icon = document.icon;

  return (
    <>
      <PageHero
        icon={Icon}
        eyebrow={document.eyebrow}
        title={document.title}
        description={document.description}
      />

      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 rounded-lg border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-md bg-blue-50 p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Version publique bêta</p>
                <p className="text-sm text-gray-600">
                  Texte extrait du document officiel fourni par YowYob.
                </p>
              </div>
            </div>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
              <a href={`/legal/${document.docxFile}`} download>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </a>
            </Button>
          </div>

          <nav className="mb-8 flex flex-wrap gap-2 text-sm">
            {legalDocumentList.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className={`rounded-md border px-3 py-2 transition-colors ${
                  item.slug === slug
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <article className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            {lines.map(renderLine)}
          </article>
        </div>
      </section>
    </>
  );
}
