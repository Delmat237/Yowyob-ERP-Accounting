import { Cookie, FileText, ShieldCheck } from 'lucide-react';

export type LegalDocumentSlug = 'terms' | 'privacy' | 'cookies';

export const legalDocuments = {
  terms: {
    slug: 'terms',
    title: 'Conditions KSM',
    eyebrow: 'CGU / Terms of Use',
    description:
      "Conditions générales d'utilisation et de service de KSM - Kit Suite Manager, version bêta publiée.",
    textFile: 'terms.txt',
    docxFile: 'terms.docx',
    icon: FileText,
  },
  privacy: {
    slug: 'privacy',
    title: 'Avis de confidentialité',
    eyebrow: 'Privacy Notice',
    description:
      'Traitements de données personnelles, responsabilités, sécurité, conservation et droits dans KSM.',
    textFile: 'privacy.txt',
    docxFile: 'privacy.docx',
    icon: ShieldCheck,
  },
  cookies: {
    slug: 'cookies',
    title: 'Notice Cookies & Publicité',
    eyebrow: 'Cookies & Ads',
    description:
      'Cookies, stockage local, analytics, publicité, choix utilisateur et technologies similaires dans KSM.',
    textFile: 'cookies.txt',
    docxFile: 'cookies.docx',
    icon: Cookie,
  },
} as const;

export const legalDocumentList = [
  legalDocuments.terms,
  legalDocuments.privacy,
  legalDocuments.cookies,
];
