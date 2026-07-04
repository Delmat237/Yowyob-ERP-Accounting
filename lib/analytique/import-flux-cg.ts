import { mockPlanComptableCG } from "@/lib/analytique/mock-data";
import {
    createEcritureAnalytique,
    listEcrituresAnalytiques,
} from "@/lib/analytique/ecritures-analytiques-store";
import {
    generateNumeroPiece,
    NATURES_CHARGE,
    getJournalAnalytiqueById,
    type EcritureAnalytique,
} from "@/lib/analytique/ecriture-analytique";

/** Lignes de charges simulées issues de la CG (classe 6). */
const MOCK_LIGNES_CG = [
    {
        ref: "CG-2026-0142-L1",
        compte: "606100",
        libelle: "Facture électricité mars 2026",
        montant: 450_000,
        centreSourceId: "c3",
        centreDestinationId: "c1",
        axeId: "1",
        exerciceId: "cg-ex-2026",
    },
    {
        ref: "CG-2026-0145-L1",
        compte: "641100",
        libelle: "Salaires atelier production",
        montant: 1_800_000,
        centreSourceId: "c3",
        centreDestinationId: "c1",
        axeId: "1",
        exerciceId: "cg-ex-2026",
    },
    {
        ref: "CG-2026-0148-L1",
        compte: "601000",
        libelle: "Achats matières premières",
        montant: 2_500_000,
        centreDestinationId: "c1",
        axeId: "1",
        exerciceId: "cg-ex-2026",
    },
    {
        ref: "CG-2026-0150-L1",
        compte: "661000",
        libelle: "Intérêts emprunt bancaire",
        montant: 95_000,
        centreDestinationId: "c3",
        axeId: "1",
        exerciceId: "cg-ex-2026",
    },
];

function isIncorporable(compteCode: string): boolean {
    const prefix = compteCode.slice(0, 3);
    const compte = mockPlanComptableCG.find(
        (c) => c.noCompte === prefix || c.noCompte === compteCode.slice(0, 4),
    );
    if (compte) return compte.incorporable;
    return !compteCode.startsWith("66") && !compteCode.startsWith("67") && !compteCode.startsWith("69");
}

function mapNatureCharge(compteCode: string): string {
    const found = NATURES_CHARGE.find((n) => n.code.startsWith(compteCode.slice(0, 3)));
    return found?.id ?? NATURES_CHARGE[0].id;
}

/**
 * Importe les flux de charges de la comptabilité générale, applique les règles
 * d'incorporation et crée des écritures analytiques en brouillon (validation).
 */
export function importFluxDepuisCG(): { created: EcritureAnalytique[]; ignored: number } {
    const existingRefs = new Set(
        listEcrituresAnalytiques()
            .map((e) => e.ligneCGRef)
            .filter(Boolean),
    );

    const journalCharge = getJournalAnalytiqueById("jal_charge");
    if (!journalCharge) return { created: [], ignored: 0 };
    const year = new Date().getFullYear();
    let seq = listEcrituresAnalytiques().length + 1;
    const created: EcritureAnalytique[] = [];
    let ignored = 0;

    for (const ligne of MOCK_LIGNES_CG) {
        if (existingRefs.has(ligne.ref)) continue;

        if (!isIncorporable(ligne.compte)) {
            ignored += 1;
            continue;
        }

        const entry = createEcritureAnalytique({
            origine: "IMPORT_CG",
            journalId: journalCharge.id,
            dateEffet: new Date().toISOString().slice(0, 10),
            numeroPiece: generateNumeroPiece(year, seq++),
            libelleOperation: ligne.libelle,
            centreSourceId: ligne.centreSourceId,
            centreDestinationId: ligne.centreDestinationId,
            axeId: ligne.axeId,
            exerciceAnalytiqueId: ligne.exerciceId,
            natureChargeId: mapNatureCharge(ligne.compte),
            montant: ligne.montant,
            ligneCGRef: ligne.ref,
        });
        created.push(entry);
    }

    return { created, ignored };
}
