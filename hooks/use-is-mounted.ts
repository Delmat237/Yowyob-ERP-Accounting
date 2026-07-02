"use client";

import { useEffect, useRef } from "react";

/** Indique si le composant est monté (utile pour ignorer les setState après await). */
export function useIsMounted() {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}
