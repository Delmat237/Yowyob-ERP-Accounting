export type LegalLineKind = 'table' | 'bullet' | 'major' | 'annex' | 'section' | 'paragraph';

export interface LegalContentLine {
  kind: LegalLineKind;
  text: string;
}

export interface LegalBlock {
  id: string;
  title: string;
  level: 'part' | 'section' | 'annex';
  lines: LegalContentLine[];
  children: LegalBlock[];
}

export interface ParsedLegalDocument {
  preamble: LegalContentLine[];
  parts: LegalBlock[];
  toc: LegalTocEntry[];
}

export interface LegalTocEntry {
  id: string;
  title: string;
  level: 'part' | 'section' | 'annex';
  children: LegalTocEntry[];
}

export function classifyLegalLine(line: string): LegalLineKind {
  if (line.includes(' || ')) return 'table';
  if (line.startsWith('• ')) return 'bullet';
  if (/^(Partie|Part A|Part B|Partie A|Partie B)/.test(line)) return 'major';
  if (/^Annexes bilingues/.test(line)) return 'major';
  if (/^(Annexe [A-Z0-9]|Annex [A-Z0-9])/.test(line)) return 'annex';
  if (/^(End of document|Fin du document)/.test(line)) return 'major';
  if (/^\d+\.\s/.test(line)) return 'section';
  return 'paragraph';
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 72) || 'section'
  );
}

function createIdFactory() {
  const used = new Map<string, number>();

  return (title: string, fallback: string) => {
    const base = slugify(title) || fallback;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

function toContentLine(text: string): LegalContentLine {
  return { kind: classifyLegalLine(text), text };
}

function shortenTocTitle(title: string, level: LegalBlock['level']): string {
  if (level === 'section') {
    const match = title.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      const label = match[2].length > 52 ? `${match[2].slice(0, 49)}…` : match[2];
      return `${match[1]}. ${label}`;
    }
  }

  if (title.length > 64) {
    return `${title.slice(0, 61)}…`;
  }

  return title;
}

function blockToToc(block: LegalBlock): LegalTocEntry {
  return {
    id: block.id,
    title: shortenTocTitle(block.title, block.level),
    level: block.level,
    children: block.children.map(blockToToc),
  };
}

export function parseLegalDocument(rawText: string): ParsedLegalDocument {
  const lines = rawText.split('\n').filter((line) => line.trim().length > 0);
  const makeId = createIdFactory();

  const preamble: LegalContentLine[] = [];
  const parts: LegalBlock[] = [];

  let currentPart: LegalBlock | null = null;
  let currentChild: LegalBlock | null = null;
  let partIndex = 0;
  let sectionIndex = 0;
  let annexIndex = 0;

  const flushChild = () => {
    if (!currentPart || !currentChild) return;
    currentPart.children.push(currentChild);
    currentChild = null;
  };

  const startPart = (title: string) => {
    flushChild();
    partIndex += 1;
    sectionIndex = 0;
    annexIndex = 0;
    currentPart = {
      id: makeId(title, `part-${partIndex}`),
      title,
      level: 'part',
      lines: [],
      children: [],
    };
    parts.push(currentPart);
    currentChild = null;
  };

  const startChild = (title: string, level: 'section' | 'annex') => {
    if (!currentPart) return;
    flushChild();

    if (level === 'section') {
      sectionIndex += 1;
      currentChild = {
        id: makeId(title, `section-${partIndex}-${sectionIndex}`),
        title,
        level: 'section',
        lines: [],
        children: [],
      };
      return;
    }

    annexIndex += 1;
    currentChild = {
      id: makeId(title, `annex-${partIndex}-${annexIndex}`),
      title,
      level: 'annex',
      lines: [],
      children: [],
    };
  };

  for (const line of lines) {
    const kind = classifyLegalLine(line);

    if (kind === 'major') {
      startPart(line);
      continue;
    }

    if (!currentPart) {
      preamble.push(toContentLine(line));
      continue;
    }

    if (kind === 'section') {
      startChild(line, 'section');
      continue;
    }

    if (kind === 'annex') {
      startChild(line, 'annex');
      continue;
    }

    if (currentChild) {
      currentChild.lines.push(toContentLine(line));
    } else {
      currentPart.lines.push(toContentLine(line));
    }
  }

  flushChild();

  const toc: LegalTocEntry[] = parts.map(blockToToc);

  if (preamble.length > 0) {
    toc.unshift({
      id: 'preamble',
      title: 'Introduction',
      level: 'part',
      children: [],
    });
  }

  return { preamble, parts, toc };
}

export function flattenTocIds(toc: LegalTocEntry[]): string[] {
  const ids: string[] = [];

  for (const entry of toc) {
    ids.push(entry.id);
    ids.push(...flattenTocIds(entry.children));
  }

  return ids;
}
