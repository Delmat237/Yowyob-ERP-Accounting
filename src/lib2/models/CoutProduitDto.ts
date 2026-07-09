export type CoutProduitDto = {
  id?: string;
  produitCode?: string;
  produitLibelle?: string;
  coutAchat?: number;
  coutProduction?: number;
  coutRevient?: number;
  methodeStock?: string;
  periodeId?: string;
};
