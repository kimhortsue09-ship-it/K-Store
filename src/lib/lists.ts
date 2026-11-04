/**
 * Nova Kit — id-list helpers (recently viewed + compare), backed by localStorage.
 * The product page writes these; the recently-viewed and compare pages read them.
 */
import { config } from '@/config';

const NS = config.data.persistNamespace;
export const RECENT_KEY = `${NS}:recentlyViewed`;
export const COMPARE_KEY = `${NS}:compare`;
export const RECENT_MAX = 12;
export const COMPARE_MAX = 4;

function read(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as string[];
  } catch {
    return [];
  }
}
function write(key: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** Push an id to the front of the recently-viewed list (deduped, capped). */
export function recordRecent(id: string) {
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, RECENT_MAX));
}

/** The outcome of {@link addCompare} — the product page toasts a different message for each. */
export type CompareResult = 'added' | 'exists' | 'full';

/**
 * Add an id to the compare set. Reports whether it was added, was already there, or the
 * set is full — the caller needs all three to explain itself to the shopper.
 */
export function addCompare(id: string): CompareResult {
  const ids = read(COMPARE_KEY);
  if (ids.includes(id)) return 'exists';
  if (ids.length >= COMPARE_MAX) return 'full';
  write(COMPARE_KEY, [...ids, id]);
  return 'added';
}
