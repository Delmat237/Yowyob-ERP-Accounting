/** Identifiant client stable pour les créations hors ligne. */
export function ensureLocalId(id?: string): string {
    if (id) return id;
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
