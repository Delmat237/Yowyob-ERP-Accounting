"use client";

import { useEffect, useState, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type ChartContainerProps = {
  height: number;
  className?: string;
  children: ReactElement;
};

/**
 * Conteneur Recharts avec hauteur explicite et rendu client uniquement,
 * pour éviter l'erreur width(-1) / height(-1) au montage.
 */
export function ChartContainer({ height, className, children }: ChartContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("w-full min-w-0", className)} style={{ height }}>
      {mounted ? (
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full rounded-lg bg-muted/40" aria-hidden />
      )}
    </div>
  );
}
