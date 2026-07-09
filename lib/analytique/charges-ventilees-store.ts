import type { ChargeVentilee } from '@/lib/analytique/mock-data';
import { mockChargesVentilees } from '@/lib/analytique/mock-data';

const STORAGE_KEY = 'ksm.analytique.charges-ventilees';

function readAll(): ChargeVentilee[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChargeVentilee[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: ChargeVentilee[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function seedIfEmpty(): ChargeVentilee[] {
  const existing = readAll();
  if (existing.length > 0) return existing;
  writeAll(mockChargesVentilees);
  return mockChargesVentilees;
}

export function listChargesVentilees(): ChargeVentilee[] {
  return seedIfEmpty();
}

export function saveChargeVentilee(entry: ChargeVentilee): ChargeVentilee {
  const all = readAll().length > 0 ? readAll() : seedIfEmpty();
  const idx = all.findIndex((c) => c.id === entry.id);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  writeAll(all);
  return entry;
}

export function deleteChargeVentilee(id: string): void {
  writeAll(readAll().filter((c) => c.id !== id));
}
