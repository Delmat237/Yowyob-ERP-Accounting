"use client";

import { useEffect, useRef } from "react";
import { useCompose } from "@/hooks/use-compose-store";
import { ComposeFormShell } from "@/components/analytique/compose-form-shell";

interface AnalytiqueOverlayModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  disabled?: boolean;
}

/**
 * Remplace les modales centrées `fixed inset-0` par la fenêtre Compose
 * avec pied de page identique à la comptabilité générale.
 */
export function AnalytiqueOverlayModal({
  title,
  onClose,
  children,
  submitLabel,
  onSubmit,
  disabled,
}: AnalytiqueOverlayModalProps) {
  const { onOpen, onClose: closeCompose } = useCompose();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    onOpen({
      title,
      isMaximized: true,
      content: (
        <ComposeFormShell
          onCancel={() => {
            closeCompose();
            onCloseRef.current();
          }}
          onSubmit={() => {
            onSubmit();
            closeCompose();
            onCloseRef.current();
          }}
          submitLabel={submitLabel}
          disabled={disabled}
        >
          {children}
        </ComposeFormShell>
      ),
    });

    return () => {
      closeCompose();
      onCloseRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
