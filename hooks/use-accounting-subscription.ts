import { create } from "zustand";
import { AccountingSubscriptionService } from "@/src/lib2/services/AccountingSubscriptionService";
import { syncStoredAccountingChoiceWithSubscription } from "@/lib/accounting-choice-resolver";
import { useAccountingChoiceStore } from "@/hooks/use-accounting-choice-store";

interface AccountingSubscriptionState {
  /** Comptabilité générale active pour l'organisation courante. */
  generale: boolean;
  /** Comptabilité analytique active pour l'organisation courante. */
  analytique: boolean;
  /** Vrai une fois l'abonnement chargé depuis le backend au moins une fois. */
  loaded: boolean;
  loading: boolean;
  /** Charge l'abonnement de l'org courante (idempotent : ne recharge pas si déjà fait). */
  load: (force?: boolean) => Promise<void>;
  /** Met à jour l'abonnement côté backend puis rafraîchit l'état local. */
  update: (generale: boolean, analytique: boolean) => Promise<void>;
}

// Défaut conservateur tant que le backend n'a pas répondu : seule la générale est
// supposée active (cohérent avec le défaut côté serveur). La sidebar n'affichera
// l'analytique qu'une fois l'abonnement confirmé.
export const useAccountingSubscription = create<AccountingSubscriptionState>((set, get) => ({
  generale: true,
  analytique: false,
  loaded: false,
  loading: false,

  load: async (force = false) => {
    if (!force && (get().loaded || get().loading)) return;
    set({ loading: true });
    try {
      const res = await AccountingSubscriptionService.getSubscription();
      const data = res?.data;
      const nextGenerale = data?.generale ?? true;
      const nextAnalytique = data?.analytique ?? false;
      set({
        generale: nextGenerale,
        analytique: nextAnalytique,
        loaded: true,
        loading: false,
      });
    } catch {
      // En cas d'échec (non authentifié, backend indisponible), on garde le défaut
      // et on marque comme chargé pour ne pas boucler.
      set({ loaded: true, loading: false });
    }
  },

  update: async (generale: boolean, analytique: boolean) => {
    const res = await AccountingSubscriptionService.updateSubscription({ generale, analytique });
    const data = res?.data;
    const nextGenerale = data?.generale ?? generale;
    const nextAnalytique = data?.analytique ?? analytique;
    set({
      generale: nextGenerale,
      analytique: nextAnalytique,
      loaded: true,
    });
    const synced = syncStoredAccountingChoiceWithSubscription(nextGenerale, nextAnalytique);
    const store = useAccountingChoiceStore.getState();
    if (synced) store.setChoice(synced);
    else store.clear();
  },
}));
