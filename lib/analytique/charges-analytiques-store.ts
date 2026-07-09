import type { ChargeAnalytique } from '@/lib/analytique/mock-data';
import { mockCharges } from '@/lib/analytique/mock-data';

const STORAGE_KEY = 'ksm.analytique.charges';

function readAll(): ChargeAnalytique[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChargeAnalytique[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: ChargeAnalytique[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function seedIfEmpty(): ChargeAnalytique[] {
  const existing = readAll();
  if (existing.length > 0) return existing;
  writeAll(mockCharges);
  return mockCharges;
}

export function listChargesAnalytiques(): ChargeAnalytique[] {
  return seedIfEmpty();
}

export function saveChargesAnalytiques(items: ChargeAnalytique[]): void {
  writeAll(items);
}

export function saveChargeAnalytique(entry: ChargeAnalytique): ChargeAnalytique {
  const all = readAll().length > 0 ? readAll() : seedIfEmpty();
  const idx = all.findIndex((c) => c.id === entry.id);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  writeAll(all);
  return entry;
}

export function deleteChargeAnalytique(id: string): void {
  writeAll(readAll().filter((c) => c.id !== id));
}
