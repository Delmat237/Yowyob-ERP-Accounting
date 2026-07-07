import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/marketing/legal-document-view';

export const metadata: Metadata = {
  title: 'Notice Cookies & Publicité | KSM',
  description: 'Notice Cookies & Publicité KSM pour les plateformes YowYob.',
};

export default function CookiesPage() {
  return <LegalDocumentView slug="cookies" />;
}
