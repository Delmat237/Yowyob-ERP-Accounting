import type { RegleValorisationStock } from '@/lib/analytique/mock-data';
import { mockReglesValorisationStock } from '@/lib/analytique/mock-data';

const STORAGE_KEY = 'ksm.analytique.regles-valorisation-stock';

function readAll(): RegleValorisationStock[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RegleValorisationStock[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: RegleValorisationStock[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function seedIfEmpty(): RegleValorisationStock[] {
  const existing = readAll();
  if (existing.length > 0) return existing;
  writeAll(mockReglesValorisationStock);
  return mockReglesValorisationStock;
}

export function listReglesValorisationStock(): RegleValorisationStock[] {
  return seedIfEmpty();
}

export function saveReglesValorisationStock(items: RegleValorisationStock[]): void {
  writeAll(items);
}
