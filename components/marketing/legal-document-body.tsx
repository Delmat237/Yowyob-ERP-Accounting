'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Download, ExternalLink } from 'lucide-react';
import type { LegalBlock, LegalTocEntry, ParsedLegalDocument } from '@/lib/legal-document-parser';
import { flattenTocIds } from '@/lib/legal-document-parser';
import type { LegalDocumentSlug } from '@/lib/legal-documents';
import { legalDocuments } from '@/lib/legal-documents';
import { LegalDocsNav } from '@/components/marketing/legal-docs-nav';
import { LegalDocumentLines } from '@/components/marketing/legal-document-lines';
import { cn } from '@/lib/utils';

interface LegalDocumentBodyProps {
  slug: LegalDocumentSlug;
  parsedDocument: ParsedLegalDocument;
}

function findAncestorIds(
  toc: LegalTocEntry[],
  targetId: string,
  ancestors: string[] = [],
): string[] | null {
  for (const entry of toc) {
    if (entry.id === targetId) return ancestors;
    const found = findAncestorIds(entry.children, targetId, [...ancestors, entry.id]);
    if (found) return found;
  }
  return null;
}

function scrollToSection(id: string) {
  const element = window.document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
}

function TocGroup({
  entry,
  activeId,
  expandedIds,
  onToggle,
  onNavigate,
  depth = 0,
}: {
  entry: LegalTocEntry;
  activeId: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  depth?: number;
}) {
  const hasChildren = entry.children.length > 0;
  const isExpanded = expandedIds.has(entry.id);
  const isActive = activeId === entry.id;

  const handleSectionClick = () => {
    if (hasChildren) {
      const willExpand = !isExpanded;
      onToggle(entry.id);
      if (willExpand) onNavigate(entry.id);
      return;
    }
    onNavigate(entry.id);
  };

  return (
    <li>
      <div className="flex items-start gap-0.5">
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Replier' : 'Déplier'}
            onClick={() => onToggle(entry.id)}
            className="mt-0.5 flex h-6 w-5 shrink-0 items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <ChevronRight
              className={cn('h-3.5 w-3.5 transition-transform duration-200', isExpanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-5 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={handleSectionClick}
          className={cn(
            'min-w-0 flex-1 py-1 text-left leading-snug transition-colors',
            depth === 0 ? 'text-[13px] font-medium' : 'text-xs',
            isActive ? 'text-blue-800' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <span className="line-clamp-2">{entry.title}</span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
          {entry.children.map((child) =>
            child.children.length > 0 ? (
              <TocGroup
                key={child.id}
                entry={child}
                activeId={activeId}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ) : (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(child.id)}
                  className={cn(
                    'w-full py-1 text-left text-xs leading-snug transition-colors',
                    activeId === child.id
                      ? 'font-medium text-blue-800'
                      : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  <span className="line-clamp-2">{child.title}</span>
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </li>
  );
}

function LegalBlockSection({ block }: { block: LegalBlock }) {
  const sectionNumber = block.title.match(/^(\d+)\./)?.[1];

  return (
    <section id={block.id} className="scroll-mt-20">
      {block.level === 'part' ? (
        <>
          <h2 className="text-3xl font-bold text-gray-900">{block.title}</h2>
          <hr className="mt-4 border-gray-200" />
        </>
      ) : (
        <h3
          className={cn(
            'text-xl font-bold text-gray-900',
            block.level === 'annex' && 'text-lg',
          )}
        >
          {sectionNumber && (
            <span className="mr-2 text-gray-500">{sectionNumber}.</span>
          )}
          {sectionNumber ? block.title.replace(/^\d+\.\s*/, '') : block.title}
        </h3>
      )}

      {block.lines.length > 0 && (
        <div className="mt-5">
          <LegalDocumentLines lines={block.lines} />
        </div>
      )}

      {block.children.length > 0 && (
        <div className="mt-10 space-y-10">
          {block.children.map((child) => (
            <div key={child.id}>
              <hr className="mb-10 border-gray-200" />
              <LegalBlockSection block={child} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function LegalDocumentBody({ slug, parsedDocument }: LegalDocumentBodyProps) {
  const documentMeta = legalDocuments[slug];
  const [activeId, setActiveId] = useState(parsedDocument.toc[0]?.id ?? 'preamble');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = parsedDocument.toc[0]?.id;
    return initial ? new Set([initial]) : new Set();
  });

  const ancestorIds = useMemo(
    () => findAncestorIds(parsedDocument.toc, activeId) ?? [],
    [parsedDocument.toc, activeId],
  );

  useEffect(() => {
    if (ancestorIds.length === 0) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const id of ancestorIds) next.add(id);
      return next;
    });
  }, [ancestorIds]);

  useEffect(() => {
    const sectionIds = flattenTocIds(parsedDocument.toc);
    const elements = sectionIds
      .map((id) => window.document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [parsedDocument.toc]);

  const handleToggle = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNavigate = (id: string) => {
    setActiveId(id);
    scrollToSection(id);
  };

  return (
    <div className="xl:grid xl:grid-cols-[220px_minmax(0,1fr)_240px] xl:items-start xl:gap-8">
      <aside className="hidden xl:block xl:sticky xl:top-16 xl:z-20 xl:max-h-[calc(100vh-4rem)] xl:w-[220px] xl:shrink-0 xl:self-start xl:overflow-y-auto xl:overscroll-contain">
        <LegalDocsNav currentSlug={slug} />
      </aside>

      <article className="min-w-0 flex-1 bg-white px-5 py-8 sm:px-8 xl:rounded-lg xl:border xl:border-gray-200 xl:shadow-sm">
        <header className="mb-8 border-b border-gray-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {documentMeta.eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
            {documentMeta.title}
          </h1>

          <a
            href={`/legal/${documentMeta.pdfFile}`}
            download
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
          >
            <Download className="h-4 w-4" />
            Télécharger le PDF
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 xl:hidden">
          {Object.values(legalDocuments).map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                item.slug === slug
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700',
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <label className="mb-8 block xl:hidden">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Sur cette page
          </span>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            value={activeId}
            onChange={(event) => handleNavigate(event.target.value)}
          >
            {parsedDocument.toc.map((entry) => (
              <optgroup key={entry.id} label={entry.title}>
                <option value={entry.id}>{entry.title}</option>
                {entry.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="space-y-12">
          {parsedDocument.preamble.length > 0 && (
            <section id="preamble" className="scroll-mt-20 space-y-5">
              <h2 className="text-3xl font-bold text-gray-900">Introduction</h2>
              <hr className="border-gray-200" />
              <LegalDocumentLines lines={parsedDocument.preamble} />
            </section>
          )}

          {parsedDocument.parts.map((part) => (
            <LegalBlockSection key={part.id} block={part} />
          ))}
        </div>
      </article>

      <aside className="hidden xl:block xl:sticky xl:top-16 xl:z-20 xl:max-h-[calc(100vh-4rem)] xl:w-[240px] xl:shrink-0 xl:self-start xl:overflow-y-auto xl:overscroll-contain xl:pl-2">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Sur cette page
        </p>
        <nav aria-label="Table des matières">
          <ul className="space-y-1">
            {parsedDocument.toc.map((entry) => (
              <TocGroup
                key={entry.id}
                entry={entry}
                activeId={activeId}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onNavigate={handleNavigate}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
