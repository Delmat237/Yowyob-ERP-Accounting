const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True si l'id n'est pas un UUID serveur (créé hors ligne). */
export function isOfflineClientId(id?: string | null): boolean {
    if (!id) return false;
    return !UUID_RE.test(id);
}

export function newOfflineEcritureId(): string {
    return `ec-offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
