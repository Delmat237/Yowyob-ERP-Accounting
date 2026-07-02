"use client";

import { FloatingModal } from "@/components/ui/floating-modal";

interface ConfirmDialogProps {
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  children: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "muted";
  showConfirm?: boolean;
}

export function ConfirmDialog({
  title,
  onClose,
  onConfirm,
  children,
  cancelLabel = "Annuler",
  confirmLabel = "Supprimer",
  confirmVariant = "destructive",
  showConfirm = true,
}: ConfirmDialogProps) {
  const confirmClass =
    confirmVariant === "destructive"
      ? "px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium"
      : "px-4 py-2 text-sm rounded-xl bg-slate-200 text-foreground border border-slate-300 font-medium hover:bg-slate-300";

  return (
    <FloatingModal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          {showConfirm && onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={confirmClass}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      }
    >
      <div className="p-6">{children}</div>
    </FloatingModal>
  );
}
