"use client";

import { useEffect, useRef } from "react";
import {
    subscribePeriodesChanged,
    type PeriodeChangeEvent,
} from "@/lib/accounting/periode-events";

/** Réagit immédiatement à une clôture / changement de période comptable. */
export function useOnPeriodesChanged(
    callback: (event: PeriodeChangeEvent) => void,
): void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(
        () => subscribePeriodesChanged((event) => callbackRef.current(event)),
        [],
    );
}
