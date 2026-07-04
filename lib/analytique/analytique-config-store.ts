import { mockGlobalConfig, type GlobalConfigAnalytique } from "@/lib/analytique/mock-data";
const STORAGE_KEY = "ksm.analytique.config";

export type AnalytiqueConfig = GlobalConfigAnalytique & {
    /** Active l'import des flux de la comptabilité générale (saisie manuelle toujours disponible). */
    importComptabiliteGeneraleActive: boolean;
};

const DEFAULT_CONFIG: AnalytiqueConfig = {
    ...mockGlobalConfig,
    importComptabiliteGeneraleActive: false,
};

function normalizeConfig(raw: Record<string, unknown>): AnalytiqueConfig {
    const merged = { ...DEFAULT_CONFIG, ...raw } as AnalytiqueConfig & {
        methodeSaisieEcritures?: string;
    };
    if (
        merged.importComptabiliteGeneraleActive === undefined &&
        merged.methodeSaisieEcritures !== undefined
    ) {
        merged.importComptabiliteGeneraleActive =
            merged.methodeSaisieEcritures === "IMPORT_CG";
    }
    return merged;
}

export function getAnalytiqueConfig(): AnalytiqueConfig {
    if (typeof window === "undefined") return DEFAULT_CONFIG;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_CONFIG;
        return normalizeConfig(JSON.parse(raw) as Record<string, unknown>);
    } catch {
        return DEFAULT_CONFIG;
    }
}

export function saveAnalytiqueConfig(config: AnalytiqueConfig): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function setImportComptabiliteGeneraleActive(active: boolean): AnalytiqueConfig {
    const config = { ...getAnalytiqueConfig(), importComptabiliteGeneraleActive: active };
    saveAnalytiqueConfig(config);
    return config;
}
