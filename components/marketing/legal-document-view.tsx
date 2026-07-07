import fs from 'node:fs/promises';
import path from 'node:path';
import { LegalDocumentBody } from '@/components/marketing/legal-document-body';
import { legalDocuments, type LegalDocumentSlug } from '@/lib/legal-documents';
import { parseLegalDocument } from '@/lib/legal-document-parser';

interface LegalDocumentViewProps {
  slug: LegalDocumentSlug;
}

async function readLegalText(fileName: string) {
  const filePath = path.join(process.cwd(), 'public', 'legal', fileName);
  return fs.readFile(filePath, 'utf8');
}

export async function LegalDocumentView({ slug }: LegalDocumentViewProps) {
  const documentMeta = legalDocuments[slug];
  const text = await readLegalText(documentMeta.textFile);
  const parsedDocument = parseLegalDocument(text);

  return (
    <section className="bg-[#f5f5f5] py-10 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <LegalDocumentBody slug={slug} parsedDocument={parsedDocument} />
      </div>
    </section>
  );
}
