export type ConfigurationAnalytiqueDto = {
  devise?: string;
  precision?: number;
  separateurMilliers?: string;
  bloquerApresClotureCg?: boolean;
  joursGraceCloture?: number;
  autoriserSaisieRetroactive?: boolean;
  methodeValorisationStocks?: string;
  importComptabiliteGeneraleActive?: boolean;
};
