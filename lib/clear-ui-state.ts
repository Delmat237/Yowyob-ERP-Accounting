import { useCompose } from '@/hooks/use-compose-store';
import { useAccountingChoiceModalStore } from '@/hooks/use-accounting-choice-modal-store';
import { useLoadingStore } from '@/hooks/use-loading-store';

/** Ferme les fenêtres Compose / modales globales et réinitialise l'UI éphémère. */
export function clearUiState(): void {
  useCompose.getState().onClose();
  useAccountingChoiceModalStore.getState().clearForceOpen();
  useLoadingStore.getState().stopLoading();
}
