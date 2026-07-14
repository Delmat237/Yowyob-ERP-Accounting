import { LegalDocumentBody } from '@/components/marketing/legal-document-body';
import { type LegalDocumentSlug } from '@/lib/legal-documents';
import { parseLegalDocument } from '@/lib/legal-document-parser';
import { getLegalDocumentContent } from '@/lib/legal-document-source';

interface LegalDocumentViewProps {
  slug: LegalDocumentSlug;
}

export async function LegalDocumentView({ slug }: LegalDocumentViewProps) {
  // Source de vérité = kernel (via le backend accounting, avec cache) ; repli sur la copie locale.
  const text = await getLegalDocumentContent(slug);
  const parsedDocument = parseLegalDocument(text);

  return (
    <section className="bg-[#f5f5f5] py-10 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <LegalDocumentBody slug={slug} parsedDocument={parsedDocument} />
      </div>
    </section>
  );
}
