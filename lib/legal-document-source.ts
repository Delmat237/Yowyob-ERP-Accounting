import fs from 'node:fs/promises';
import path from 'node:path';
import { legalDocuments, type LegalDocumentSlug } from '@/lib/legal-documents';
import { pickRemoteLegalContent } from '@/lib/legal-content';

/**
 * Source des documents légaux.
 *
 * Le kernel est l'unique source de vérité. Chaque plateforme les récupère via son backend :
 * frontend → backend accounting (`/api/legal-documents/{slug}`, qui relaie le kernel et met en
 * cache) → kernel. Conformément à l'architecture online-first + repli du projet, on retombe sur
 * la copie locale `public/legal/*.txt` si le backend/kernel est injoignable (ou hors ligne).
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://accounting.yowyob.com/accounting-api').replace(
  /\/+$/,
  '',
);

// Le backend met déjà en cache côté serveur ; on ajoute une revalidation Next pour éviter un appel
// à chaque rendu SSR.
const REVALIDATE_SECONDS = 600;

async function fetchRemoteContent(slug: LegalDocumentSlug): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/api/legal-documents/${slug}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return pickRemoteLegalContent(await response.json());
  } catch {
    // Backend/kernel injoignable → repli local.
    return null;
  }
}

async function readLocalContent(fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'public', 'legal', fileName);
  return fs.readFile(filePath, 'utf8');
}

export async function getLegalDocumentContent(slug: LegalDocumentSlug): Promise<string> {
  const remote = await fetchRemoteContent(slug);
  if (remote) return remote;
  return readLocalContent(legalDocuments[slug].textFile);
}
