import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/marketing/legal-document-view';

export const metadata: Metadata = {
  title: 'Conditions KSM | KSM',
  description: "Conditions générales d'utilisation et de service KSM.",
};

export default function TermsPage() {
  return <LegalDocumentView slug="terms" />;
}
