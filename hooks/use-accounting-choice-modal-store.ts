import { create } from 'zustand/react';

interface AccountingChoiceModalState {
  /** Force l'ouverture du modal (ex. tentative d'accès analytique sans choix). */
  forceOpen: boolean;
  requestOpen: () => void;
  clearForceOpen: () => void;
}

export const useAccountingChoiceModalStore = create<AccountingChoiceModalState>((set) => ({
  forceOpen: false,
  requestOpen: () => set({ forceOpen: true }),
  clearForceOpen: () => set({ forceOpen: false }),
}));
