import type { MethodeCalculCoût } from '@/lib/analytique/mock-data';
import { mockMethodesCalcul } from '@/lib/analytique/mock-data';

const STORAGE_KEY = 'ksm.analytique.methodes-calcul-cout';

function readAll(): MethodeCalculCoût[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MethodeCalculCoût[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: MethodeCalculCoût[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function seedIfEmpty(): MethodeCalculCoût[] {
  const existing = readAll();
  if (existing.length > 0) return existing;
  writeAll(mockMethodesCalcul);
  return mockMethodesCalcul;
}

export function listMethodesCalculCout(): MethodeCalculCoût[] {
  return seedIfEmpty();
}

export function saveMethodesCalculCout(items: MethodeCalculCoût[]): void {
  writeAll(items);
}
