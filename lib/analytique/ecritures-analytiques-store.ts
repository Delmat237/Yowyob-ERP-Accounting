import type { EcritureAnalytique, StatutEcritureAnalytique } from "@/lib/analytique/ecriture-analytique";
import { buildLignesImputation } from "@/lib/analytique/ecriture-lignes";

const STORAGE_KEY = "ksm.analytique.ecritures";

function readAll(): EcritureAnalytique[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as EcritureAnalytique[]) : [];
    } catch {
        return [];
    }
}

function writeAll(items: EcritureAnalytique[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listEcrituresAnalytiques(): EcritureAnalytique[] {
    return readAll().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function listEcrituresByStatut(statut: StatutEcritureAnalytique): EcritureAnalytique[] {
    return listEcrituresAnalytiques().filter((e) => e.statut === statut);
}

export function saveEcritureAnalytique(entry: EcritureAnalytique): EcritureAnalytique {
    const all = readAll();
    const idx = all.findIndex((e) => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    writeAll(all);
    return entry;
}

export function createEcritureAnalytique(
    data: Omit<EcritureAnalytique, "id" | "createdAt" | "statut" | "lignes">,
): EcritureAnalytique {
    const lignes = buildLignesImputation(data);
    const entry: EcritureAnalytique = {
        ...data,
        lignes,
        id: `ea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        statut: "BROUILLON",
        createdAt: new Date().toISOString(),
    };
    return saveEcritureAnalytique(entry);
}

export function validateEcritureAnalytique(id: string): EcritureAnalytique | null {
    const all = readAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    all[idx] = {
        ...all[idx],
        statut: "VALIDEE",
        validatedAt: new Date().toISOString(),
        rejectReason: undefined,
    };
    writeAll(all);
    return all[idx];
}

export function rejectEcritureAnalytique(id: string, reason: string): EcritureAnalytique | null {
    const all = readAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    all[idx] = {
        ...all[idx],
        statut: "REJETEE",
        rejectReason: reason,
    };
    writeAll(all);
    return all[idx];
}

export function deleteEcritureAnalytique(id: string): void {
    writeAll(readAll().filter((e) => e.id !== id));
}

export function countPiecesForYear(year: number): number {
    return readAll().filter((e) =>
        e.numeroPiece.match(new RegExp(`^(CA|ECRIT-ANALYTIQUE)-${year}-`)),
    ).length;
}
