import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date for API query parameters (YYYY-MM-DD).
 * Handles:
 * - Arrays: [2026, 3, 31] -> "2026-03-31"
 * - ISO strings or Date strings: "2026-03-31T00:00:00.000Z" -> "2026-03-31"
 * - Date objects
 */
export function formatDateForApi(date: any): string {
  if (!date) return "";

  if (Array.isArray(date)) {
    const [year, month, day] = date;
    // Month in array is usually 1-indexed from backend, but if it was 0-indexed we'd adjust.
    // Given user example ?date_debut=2026&date_debut=3&date_debut=1, it's 1-indexed.
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  if (typeof date === 'string') {
    return date.split('T')[0];
  }

  return String(date);
}

/** Début de journée pour les paramètres API audit (ISO DATE_TIME). */
export function formatDateTimeStartForApi(date: any): string {
  const day = formatDateForApi(date);
  return day ? `${day}T00:00:00` : "";
}

/** Fin de journée pour les paramètres API audit (ISO DATE_TIME). */
export function formatDateTimeEndForApi(date: any): string {
  const day = formatDateForApi(date);
  return day ? `${day}T23:59:59` : "";
}

/** Affichage utilisateur JJ/MM/AAAA (gère aussi les tableaux [année, mois, jour] de l'API). */
export function formatDateDisplay(date: any): string {
  const iso = formatDateForApi(date);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatCurrency(amount: number, currency = "XAF"): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}
