'use client';

import Link from 'next/link';
import { Cookie, FileText, Scale, ShieldCheck } from 'lucide-react';
import { legalDocumentList, type LegalDocumentSlug } from '@/lib/legal-documents';
import { cn } from '@/lib/utils';

const icons = {
  terms: FileText,
  privacy: ShieldCheck,
  cookies: Cookie,
} as const;

interface LegalDocsNavProps {
  currentSlug: LegalDocumentSlug;
}

export function LegalDocsNav({ currentSlug }: LegalDocsNavProps) {
  return (
    <nav aria-label="Documents légaux">
      <div className="border-r border-gray-200 pr-6">
        <div className="mb-4 flex items-center gap-2 text-gray-500">
          <Scale className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">Légal</p>
        </div>

        <ul className="space-y-0.5">
          {legalDocumentList.map((item) => {
            const Icon = icons[item.slug];
            const isActive = item.slug === currentSlug;

            return (
              <li key={item.slug}>
                <Link
                  href={`/${item.slug}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md py-2 pl-2 pr-3 text-sm transition-colors',
                    isActive
                      ? 'border-l-2 border-blue-600 bg-blue-50/60 font-medium text-blue-900'
                      : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="leading-snug">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
