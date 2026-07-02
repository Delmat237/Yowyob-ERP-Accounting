"use client";

import { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ComposeFormShellProps {
  children: ReactNode;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
}

/** Enveloppe standard des formulaires analytiques dans la fenêtre Compose (comme la CG). */
export function ComposeFormShell({
  children,
  onCancel,
  onSubmit,
  submitLabel,
  disabled = false,
}: ComposeFormShellProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!disabled) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
      <div className="sticky bottom-0 bg-slate-50/90 backdrop-blur-sm p-6 border-t border-slate-200 flex justify-end gap-4 mt-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 px-10 border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-600"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={disabled}
          className="h-11 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200"
        >
          <Save className="h-5 w-5 mr-2" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
