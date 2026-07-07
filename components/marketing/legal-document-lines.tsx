import type { LegalContentLine } from '@/lib/legal-document-parser';
import { cn } from '@/lib/utils';

type LineGroup =
  | { type: 'table'; rows: string[][] }
  | { type: 'content'; line: LegalContentLine; index: number };

function groupLines(lines: LegalContentLine[]): LineGroup[] {
  const groups: LineGroup[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    groups.push({ type: 'table', rows: tableRows });
    tableRows = [];
  };

  for (const [index, line] of lines.entries()) {
    if (line.kind === 'table') {
      tableRows.push(line.text.split(' || ').map((cell) => cell.trim()));
      continue;
    }

    flushTable();
    groups.push({ type: 'content', line, index });
  }

  flushTable();
  return groups;
}

function tableColumnTemplate(columnCount: number) {
  if (columnCount === 2) {
    return 'minmax(160px, 0.38fr) minmax(0, 1fr)';
  }

  if (columnCount === 3) {
    return 'minmax(140px, 0.75fr) minmax(120px, 0.85fr) minmax(0, 1.2fr)';
  }

  return `repeat(${columnCount}, minmax(0, 1fr))`;
}

function LegalTable({ rows }: { rows: string[][] }) {
  const columnCount = Math.max(...rows.map((row) => row.length), 1);

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <div className="min-w-[480px]">
        {rows.map((row, rowIndex) => (
          <div
            key={`${rowIndex}-${row[0]?.slice(0, 12) ?? 'row'}`}
            className={cn(
              'grid border-t border-gray-200 text-sm first:border-t-0',
              rowIndex === 0 && 'bg-gray-50 font-semibold text-gray-900',
            )}
            style={{ gridTemplateColumns: tableColumnTemplate(columnCount) }}
          >
            {Array.from({ length: columnCount }, (_, cellIndex) => (
              <div
                key={`${rowIndex}-${cellIndex}`}
                className={cn(
                  'px-3 py-2.5 align-top leading-relaxed',
                  rowIndex > 0 && cellIndex === 0 && 'font-medium text-gray-900',
                  rowIndex > 0 && cellIndex > 0 && 'text-gray-700',
                )}
              >
                {row[cellIndex] ?? ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LegalDocumentLine({ line, index }: { line: LegalContentLine; index: number }) {
  const { kind, text } = line;

  if (kind === 'bullet') {
    return (
      <p key={`${index}-${text.slice(0, 16)}`} className="pl-4 text-[15px] leading-7 text-gray-700">
        {text}
      </p>
    );
  }

  return (
    <p key={`${index}-${text.slice(0, 16)}`} className="text-[15px] leading-7 text-gray-700">
      {text}
    </p>
  );
}

export function LegalDocumentLines({ lines }: { lines: LegalContentLine[] }) {
  if (lines.length === 0) return null;

  const groups = groupLines(lines);

  return (
    <div className="space-y-3.5">
      {groups.map((group) => {
        if (group.type === 'table') {
          return <LegalTable key={`table-${group.rows[0]?.[0] ?? 'empty'}`} rows={group.rows} />;
        }

        return (
          <LegalDocumentLine
            key={`${group.index}-${group.line.text.slice(0, 12)}`}
            line={group.line}
            index={group.index}
          />
        );
      })}
    </div>
  );
}
