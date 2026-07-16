// lib/export/table-export.ts
// Export de tableaux côté client, sans dépendance :
//   - Excel : fichier .xls (table HTML qu'Excel/LibreOffice ouvrent en grille).
//   - PDF   : fenêtre d'impression du navigateur (→ « Enregistrer au format PDF »).

export interface ExportColumn<T> {
    header: string;
    value: (row: T) => string;
}

function escapeHtml(value: string): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
}

/** Télécharge les lignes sous forme de fichier Excel (.xls, ouvert en grille). */
export function exportRowsToExcel<T>(
    filename: string,
    title: string,
    columns: ExportColumn<T>[],
    rows: T[],
): void {
    const thead = `<tr>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr>`;
    const tbody = rows
        .map((r) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.value(r))}</td>`).join('')}</tr>`)
        .join('');
    const html =
        `<html><head><meta charset="utf-8"></head><body>` +
        `<table border="1"><caption>${escapeHtml(title)}</caption>` +
        `<thead>${thead}</thead><tbody>${tbody}</tbody></table></body></html>`;
    // BOM UTF-8 pour la bonne prise en charge des accents par Excel.
    const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    triggerDownload(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
}

/** Ouvre une fenêtre imprimable (l'utilisateur choisit « Enregistrer au format PDF »). */
export function exportRowsToPdf<T>(
    title: string,
    subtitle: string,
    columns: ExportColumn<T>[],
    rows: T[],
): boolean {
    const win = window.open('', '_blank');
    if (!win) return false; // popup bloqué

    const thead = `<tr>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr>`;
    const tbody = rows
        .map((r) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.value(r))}</td>`).join('')}</tr>`)
        .join('');
    const generatedAt = new Date().toLocaleString('fr-FR');

    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
            * { font-family: Arial, Helvetica, sans-serif; }
            h1 { font-size: 18px; margin: 0 0 4px; }
            .sub { color: #555; font-size: 12px; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
            thead th { background: #f1f5f9; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            @media print { .noprint { display: none; } }
        </style></head><body>
        <h1>${escapeHtml(title)}</h1>
        <p class="sub">${escapeHtml(subtitle)} — généré le ${escapeHtml(generatedAt)}</p>
        <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
        <script>window.onload = function () { window.print(); };</script>
        </body></html>`);
    win.document.close();
    return true;
}
