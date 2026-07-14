/**
 * Logique pure d'extraction du contenu légal renvoyé par le backend accounting.
 *
 * Isolée (sans fetch/fs/alias) pour être testable directement par le runner natif `node --test`,
 * à l'image de `lib/offline/conflict.ts`.
 */

interface LegalApiBody {
  data?: {
    content?: unknown;
  } | null;
}

/**
 * Retourne le contenu texte si la réponse en porte un non vide, sinon `null`
 * (déclenche le repli local côté appelant).
 */
export function pickRemoteLegalContent(body: unknown): string | null {
  const content = (body as LegalApiBody | null | undefined)?.data?.content;
  return typeof content === 'string' && content.trim().length > 0 ? content : null;
}
