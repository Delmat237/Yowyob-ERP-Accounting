import {
    DEFAULT_JOURNAUX_ANALYTIQUES,
    type JournalAnalytiqueConfig,
} from "@/lib/analytique/journal-analytique";

const STORAGE_KEY = "ksm.analytique.journaux";

function readAll(): JournalAnalytiqueConfig[] {
    if (typeof window === "undefined") return DEFAULT_JOURNAUX_ANALYTIQUES;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_JOURNAUX_ANALYTIQUES;
        const parsed = JSON.parse(raw) as JournalAnalytiqueConfig[];
        return parsed.length > 0 ? parsed : DEFAULT_JOURNAUX_ANALYTIQUES;
    } catch {
        return DEFAULT_JOURNAUX_ANALYTIQUES;
    }
}

function writeAll(items: JournalAnalytiqueConfig[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listJournauxAnalytiques(): JournalAnalytiqueConfig[] {
    return readAll();
}

export function listJournauxAnalytiquesActifs(): JournalAnalytiqueConfig[] {
    return readAll().filter((j) => j.actif);
}

export function getJournalAnalytiqueById(id: string): JournalAnalytiqueConfig | undefined {
    return readAll().find((j) => j.id === id);
}

export function saveJournalAnalytique(journal: JournalAnalytiqueConfig): JournalAnalytiqueConfig {
    const all = readAll();
    const idx = all.findIndex((j) => j.id === journal.id);
    if (idx >= 0) all[idx] = journal;
    else all.push(journal);
    writeAll(all);
    return journal;
}

export function createJournalAnalytique(
    data: Omit<JournalAnalytiqueConfig, "id"> & { id?: string },
): JournalAnalytiqueConfig {
    const journal: JournalAnalytiqueConfig = {
        ...data,
        id: data.id ?? `jal-${Date.now()}`,
    };
    return saveJournalAnalytique(journal);
}

export function deleteJournalAnalytique(id: string): void {
    writeAll(readAll().filter((j) => j.id !== id));
}
