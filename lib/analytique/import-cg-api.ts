import { unwrapApiData } from '@/lib/analytique/analytique-api';
import { mapEcritureDtoToUi } from '@/lib/analytique/analytique-mappers';
import { importFluxDepuisCG } from '@/lib/analytique/import-flux-cg';
import type { EcritureAnalytique } from '@/lib/analytique/ecriture-analytique';
import { AccountingEcrituresAnalytiquesService } from '@/src/lib2/services/AccountingEcrituresAnalytiquesService';
import type { ImportCgRequestDto } from '@/src/lib2/models/ImportCgRequestDto';

export type ImportCgUiResult = {
  created: EcritureAnalytique[];
  ignored: number;
  errors: string[];
  fromApi: boolean;
};

export async function importDepuisCG(
  options?: ImportCgRequestDto,
  usingMockFallback = false,
): Promise<ImportCgUiResult> {
  if (usingMockFallback) {
    const { created, ignored } = importFluxDepuisCG();
    return { created, ignored, errors: [], fromApi: false };
  }

  try {
    const response = await AccountingEcrituresAnalytiquesService.importCg(options);
    const data = unwrapApiData(response, "Impossible d'importer depuis la comptabilité générale.");
    return {
      created: (data.created ?? []).map(mapEcritureDtoToUi),
      ignored: data.ignored ?? 0,
      errors: data.errors ?? [],
      fromApi: true,
    };
  } catch {
    const { created, ignored } = importFluxDepuisCG();
    return { created, ignored, errors: [], fromApi: false };
  }
}
