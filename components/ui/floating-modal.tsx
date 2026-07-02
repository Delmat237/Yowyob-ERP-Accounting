"use client";

import { useEffect, useRef } from "react";
import { useCompose } from "@/hooks/use-compose-store";

export type FloatingModalSize = "default" | "large" | "fullscreen";

interface FloatingModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  defaultSize?: FloatingModalSize;
  initialPosition?: { x: number; y: number };
  accentColor?: string;
}

/**
 * Pont vers ComposeWindow : même fenêtre flottante que la comptabilité générale.
 */
export function FloatingModal({
  title,
  onClose,
  children,
  footer,
}: FloatingModalProps) {
  const { onOpen, onClose: closeCompose, isOpen } = useCompose();
  const onCloseRef = useRef(onClose);
  const ownedRef = useRef(false);
  const hasBeenOpenRef = useRef(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    ownedRef.current = true;
    hasBeenOpenRef.current = false;
    onOpen({
      title,
      isMaximized: true,
      content: (
        <div className="flex flex-col h-full bg-white">
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer ? (
            <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50/90">
              {footer}
            </div>
          ) : null}
        </div>
      ),
    });

    return () => {
      ownedRef.current = false;
      hasBeenOpenRef.current = false;
      closeCompose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      hasBeenOpenRef.current = true;
    }
  }, [isOpen]);

  // Ne synchronise la fermeture Compose → parent qu'après une ouverture réelle
  // (évite de fermer immédiatement au montage quand isOpen est encore false).
  useEffect(() => {
    if (ownedRef.current && hasBeenOpenRef.current && !isOpen) {
      ownedRef.current = false;
      hasBeenOpenRef.current = false;
      onCloseRef.current();
    }
  }, [isOpen]);

  return null;
}
