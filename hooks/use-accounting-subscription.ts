import { create } from 'zustand/react';
import { AccountingSubscriptionService } from "@/src/lib2/services/AccountingSubscriptionService";
import { syncStoredAccountingChoiceWithSubscription } from "@/lib/accounting-choice-resolver";
import { useAccountingChoiceStore } from "@/hooks/use-accounting-choice-store";
import { networkStatus } from "@/lib/offline/network-status";

const SUBSCRIPTION_CACHE_KEY = "offline.cache.accounting_subscription";

type SubscriptionCache = {
  generale: boolean;
  analytique: boolean;
};

function readSubscriptionCache(): SubscriptionCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as SubscriptionCache) : null;
  } catch {
    return null;
  }
}

function writeSubscriptionCache(generale: boolean, analytique: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SUBSCRIPTION_CACHE_KEY,
    JSON.stringify({ generale, analytique } satisfies SubscriptionCache),
  );
}

function isApiFailure(res: unknown): boolean {
  return Boolean(
    res &&
      typeof res === "object" &&
      "success" in res &&
      (res as { success?: boolean }).success === false,
  );
}

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
const initialCached = readSubscriptionCache();
const bootstrapOffline =
  typeof navigator !== "undefined" && !navigator.onLine;

export const useAccountingSubscription = create<AccountingSubscriptionState>((set, get) => ({
  generale: initialCached?.generale ?? true,
  analytique: initialCached?.analytique ?? false,
  loaded: bootstrapOffline || Boolean(initialCached),
  loading: false,

  load: async (force = false) => {
    if (!force && (get().loaded || get().loading)) return;

    const cached = readSubscriptionCache();
    if (!networkStatus.isOnline()) {
      set({
        generale: cached?.generale ?? true,
        analytique: cached?.analytique ?? false,
        loaded: true,
        loading: false,
      });
      return;
    }

    set({ loading: true });
    try {
      const res = await AccountingSubscriptionService.getSubscription();
      if (isApiFailure(res)) {
        set({
          generale: cached?.generale ?? true,
          analytique: cached?.analytique ?? false,
          loaded: true,
          loading: false,
        });
        return;
      }
      const data = res?.data;
      const nextGenerale = data?.generale ?? true;
      const nextAnalytique = data?.analytique ?? false;
      writeSubscriptionCache(nextGenerale, nextAnalytique);
      set({
        generale: nextGenerale,
        analytique: nextAnalytique,
        loaded: true,
        loading: false,
      });
    } catch {
      set({
        generale: cached?.generale ?? true,
        analytique: cached?.analytique ?? false,
        loaded: true,
        loading: false,
      });
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
    writeSubscriptionCache(nextGenerale, nextAnalytique);
    const synced = syncStoredAccountingChoiceWithSubscription(nextGenerale, nextAnalytique);
    const store = useAccountingChoiceStore.getState();
    if (synced) store.setChoice(synced);
    else store.clear();
  },
}));
