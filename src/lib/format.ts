/**
 * Nova Kit — Formatting helpers
 * Currency + date formatting that respect config.currency.
 */
import { config } from '@/config';

export function formatPrice(amount: number): string {
  const { symbol, position, decimals, thousands, decimal } = config.currency;
  const fixed = Math.abs(amount).toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const withThousands = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const num = frac ? `${withThousands}${decimal}${frac}` : withThousands;
  const sign = amount < 0 ? '-' : '';
  return position === 'before' ? `${sign}${symbol}${num}` : `${sign}${num}${symbol}`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Deterministic thousands grouping (e.g. 12345 → "12,345") using the configured separator.
 * Use this instead of Number.prototype.toLocaleString() in rendered output — the latter groups
 * per the runtime locale, which differs between the Node server and the browser and causes a
 * React hydration mismatch.
 */
export function formatNumber(n: number): string {
  const neg = n < 0 ? '-' : '';
  const [int, frac] = Math.abs(n).toString().split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, config.currency.thousands);
  return frac ? `${neg}${grouped}${config.currency.decimal}${frac}` : `${neg}${grouped}`;
}

/** Deterministic "Ddd, Mon D" (e.g. "Fri, Jun 28"). UTC-based so it never shifts by timezone. */
export function formatDateWeekday(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${DAYS_SHORT[d.getUTCDay()]}, ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/**
 * Deterministic "Mon D, YYYY" (e.g. "Jun 28, 2024"). We format manually rather than via
 * toLocaleDateString(undefined, …) because under SSR the Node runtime's default locale and the
 * browser's differ (e.g. "28 Jun 2024" vs "Jun 28, 2024"), which triggers a React hydration
 * mismatch. A fixed format renders identically on server and client. Dates are read in UTC so
 * the day component never shifts across timezones between server and client.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
