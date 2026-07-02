"use client";

import { ReactNode, useCallback } from "react";
import { useCompose } from "@/hooks/use-compose-store";

/** Ouvre un formulaire analytique dans la même fenêtre Compose que la comptabilité générale. */
export function useAnalytiqueCompose() {
  const compose = useCompose();

  const openForm = useCallback(
    (title: string, content: ReactNode, isMaximized = true) => {
      compose.onOpen({ title, content, isMaximized });
    },
    [compose],
  );

  return {
    ...compose,
    openForm,
    closeForm: compose.onClose,
  };
}
