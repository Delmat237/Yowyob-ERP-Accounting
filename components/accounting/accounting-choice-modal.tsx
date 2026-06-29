"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, PieChart, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigationStore } from '@/hooks/use-navigation-store';
import { ModuleKey } from '@/config/navigation';
import { useLoadingStore } from '@/hooks/use-loading-store';
import { useAccountingSubscription } from '@/hooks/use-accounting-subscription';

// Marqueur de session : posé une fois que l'utilisateur a choisi son espace.
// Tant qu'il est absent, le modal s'affiche (à l'ouverture de l'app ou après un
// login, où la clé est réinitialisée). Effacé au logout.
export const ACCOUNTING_CHOICE_KEY = 'ksm.accountingChoiceMade';

type Choice = {
  key: Extract<ModuleKey, 'generale' | 'analytique'>;
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
  accent: string;
};

const choices: Choice[] = [
  {
    key: 'generale',
    title: 'Comptabilité Générale',
    description: 'Plan comptable, écritures, journaux et validation des opérations.',
    href: '/accounting/chart-of-accounts',
    icon: BookOpen,
    accent: 'from-blue-600 to-indigo-600',
  },
  {
    key: 'analytique',
    title: 'Comptabilité Analytique',
    description: 'Axes analytiques, budgets, suivi budgétaire et rapports de gestion.',
    href: '/accounting/analytics',
    icon: PieChart,
    accent: 'from-indigo-600 to-violet-600',
  },
];

export function AccountingChoiceModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setActiveModule } = useNavigationStore();
  const { startLoading } = useLoadingStore();
  const { generale, analytique, loaded, load } = useAccountingSubscription();

  // Charge l'abonnement de l'organisation courante (si pas déjà fait par la sidebar).
  useEffect(() => {
    load();
  }, [load]);

  // Ne propose que les espaces auxquels l'organisation est abonnée.
  const availableChoices = choices.filter(
    (c) => (c.key === 'generale' ? generale : analytique),
  );

  useEffect(() => {
    // On attend la réponse du backend avant de décider quoi afficher.
    if (!loaded) return;
    if (sessionStorage.getItem(ACCOUNTING_CHOICE_KEY) === '1') return;

    // Un seul espace actif : pas de choix à faire, on bascule directement dessus.
    if (availableChoices.length === 1) {
      setActiveModule(availableChoices[0].key);
      sessionStorage.setItem(ACCOUNTING_CHOICE_KEY, '1');
      return;
    }
    // Plusieurs espaces actifs : on affiche le modal de choix.
    if (availableChoices.length > 1) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, generale, analytique]);

  const markChosen = () => sessionStorage.setItem(ACCOUNTING_CHOICE_KEY, '1');

  const handleSelect = (choice: Choice) => {
    markChosen();
    setActiveModule(choice.key);
    setOpen(false);
    startLoading();
    router.push(choice.href);
  };

  const handleDismiss = (next: boolean) => {
    if (!next) markChosen();
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-lg w-full mx-4 bg-white rounded-xl shadow-xl border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Quelle comptabilité souhaitez-vous faire ?
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Choisissez votre espace de travail. Vous pourrez basculer à tout moment depuis le menu latéral.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {availableChoices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              onClick={() => handleSelect(choice)}
              className="group text-left rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${choice.accent} flex items-center justify-center mb-4`}
              >
                <choice.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                {choice.title}
                <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{choice.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
