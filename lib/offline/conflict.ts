/** Détection de conflit offline (alignée backend ConflictException / HTTP 409). */
export function isSyncConflictMessage(message: string): boolean {
    const lower = message.toLowerCase();
    return (
        message.startsWith("CONFLICT:") ||
        message.includes("409") ||
        lower.includes("conflit") ||
        lower.includes("conflict")
    );
}

/**
 * Conflit soft via updatedAt : le serveur a une version plus récente que le client.
 * Les dates absentes = pas de conflit détectable.
 */
export function hasUpdatedAtConflict(
    serverUpdatedAt: string | Date | null | undefined,
    clientUpdatedAt: string | Date | null | undefined,
): boolean {
    if (!serverUpdatedAt || !clientUpdatedAt) return false;
    const server = serverUpdatedAt instanceof Date ? serverUpdatedAt : new Date(serverUpdatedAt);
    const client = clientUpdatedAt instanceof Date ? clientUpdatedAt : new Date(clientUpdatedAt);
    if (Number.isNaN(server.getTime()) || Number.isNaN(client.getTime())) return false;
    return server.getTime() > client.getTime();
}
