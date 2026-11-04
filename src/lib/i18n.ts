/**
 * Nova Kit — Localisation
 * File-per-language dictionaries. Add a language by creating locales/xx.ts, importing it
 * below, and adding its code to config.locale.available (and rtlLocales if right-to-left).
 * `t('a.b')` falls back to the default locale, then to the key itself.
 */
import { config } from '@/config';
import en from './locales/en';
import es from './locales/es';
import ar from './locales/ar';

export type Dict = Record<string, string>;
const DICTS: Record<string, Dict> = { en, es, ar };

/** Display name per locale (the HTML edition keeps this on the locale file itself). */
const NAMES: Record<string, string> = { en: 'English', es: 'Español', ar: 'العربية', fr: 'Français', de: 'Deutsch' };

const LOCALE_KEY = `${config.data.persistNamespace}:locale`;

/** Locales offered by a language switcher: [{ code, name }] — driven by config.locale.available. */
export function availableLocales(): { code: string; name: string }[] {
  return config.locale.available
    .filter((code) => DICTS[code])
    .map((code) => ({ code, name: NAMES[code] || code.toUpperCase() }));
}

export function currentLocale(): string {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(LOCALE_KEY);
    if (saved && config.locale.available.includes(saved)) return saved;
  }
  return config.locale.default;
}

export function setLocale(code: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(LOCALE_KEY, code);
}

export function isRtl(code = currentLocale()): boolean {
  return config.locale.rtlLocales.includes(code);
}

/**
 * Translate a key with optional interpolation, e.g. `t('product.reviews', { count: 12 })`.
 * Falls back to the default locale, then to the key itself, so a missing string never
 * breaks the UI.
 */
export function t(key: string, vars?: Record<string, string | number>, locale = currentLocale()): string {
  let str = DICTS[locale]?.[key] ?? DICTS[config.locale.default]?.[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}
