import { create } from 'zustand/react';
import {
  clearAccountingChoice,
  getAccountingChoice,
  setAccountingChoice as persistAccountingChoice,
  type AccountingChoice,
} from '@/lib/accounting-choice';

interface AccountingChoiceState {
  choice: AccountingChoice | null;
  hydrate: () => void;
  setChoice: (choice: AccountingChoice) => void;
  clear: () => void;
}

export const useAccountingChoiceStore = create<AccountingChoiceState>((set) => ({
  choice: null,

  hydrate: () => set({ choice: getAccountingChoice() }),

  setChoice: (choice) => {
    persistAccountingChoice(choice);
    set({ choice });
  },

  clear: () => {
    clearAccountingChoice();
    set({ choice: null });
  },
}));

export function hasAnalytiqueAccessFromStore(): boolean {
  const fromStore = useAccountingChoiceStore.getState().choice;
  if (fromStore !== null) return fromStore === 'analytique';
  return getAccountingChoice() === 'analytique';
}
