import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/marketing/legal-document-view';

export const metadata: Metadata = {
  title: 'Avis de confidentialité | KSM',
  description: 'Avis de confidentialité KSM pour les plateformes YowYob.',
};

export default function PrivacyPage() {
  return <LegalDocumentView slug="privacy" />;
}
