'use client';
/** Settings — faithful port: appearance segmented control, language, currency, notification toggles. */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { availableLocales, currentLocale, setLocale, t } from '@/lib/i18n';
import { usePersistentState } from '@/lib/usePersistentState';
import { haptic, telegramColorScheme } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { TabBar } from '@/components/TabBar';

const NS = config.data.persistNamespace;
const THEME_KEY = `${NS}:theme`;
const CURRENCY_NAMES: Record<string, string> = { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', NGN: 'Nigerian Naira', INR: 'Indian Rupee', JPY: 'Japanese Yen', CAD: 'Canadian Dollar', AUD: 'Australian Dollar', BRL: 'Brazilian Real' };

type Scheme = 'light' | 'dark' | 'auto';

/** The user's saved preference — 'auto' means "no explicit choice" (no key stored). */
function savedColorScheme(): Scheme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

/** Resolve the effective scheme: saved → config → Telegram → OS (mirrors the kit's theme.js). */
function resolveScheme(): 'light' | 'dark' {
  let saved: string | null = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
  const pref = saved || config.theme.colorScheme || 'auto';
  if (pref === 'light' || pref === 'dark') return pref;
  return telegramColorScheme() || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

/**
 * Persist an explicit scheme and apply it. 'auto' REMOVES the key, so the scheme is re-resolved
 * from config → Telegram → OS on every load instead of being frozen to a concrete value.
 */
function setColorScheme(scheme: Scheme) {
  try {
    if (scheme === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, scheme);
  } catch { /* ignore */ }
  document.documentElement.setAttribute('data-theme', resolveScheme());
}

export default function SettingsPage() {
  const router = useRouter();
  const [scheme, setScheme] = useState<Scheme>('auto');
  const [locale, setLocaleState] = useState<string>(config.locale.default);
  const [prefs, setPrefs] = usePersistentState<Record<string, boolean>>(`${NS}:prefs`, {});
  const currencyName = CURRENCY_NAMES[config.currency.code] || config.currency.code;

  // Hydrate from localStorage after mount so SSR and the first client render match.
  useEffect(() => {
    setScheme(savedColorScheme());
    setLocaleState(currentLocale());
  }, []);

  const applyScheme = (s: Scheme) => {
    setColorScheme(s);
    setScheme(s);
    haptic('selection');
  };

  const chooseLang = (code: string) => {
    if (code === locale) return;
    setLocale(code);
    document.documentElement.setAttribute('dir', config.locale.rtlLocales.includes(code) ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', code);
    haptic('selection');
    toast(t('settings.language_updated'), { kind: 'success' });
    setLocaleState(code); // re-render: t() now resolves against the new locale
  };

  return (
    <>
      <header className="appbar">
        <button className="appbar__btn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={22} /></button>
        <h1 className="appbar__title">{t('profile.settings')}</h1>
        <div className="appbar__actions" />
      </header>

      <main className="screen">
        {config.theme.allowUserToggle && (
          <div className="settings-group"><div className="settings-group__label">{t('settings.appearance')}</div>
            <div className="card card--pad"><div className="segmented">
              {([['light', 'settings.light'], ['dark', 'settings.dark'], ['auto', 'settings.auto']] as const).map(([s, l]) => (
                <button key={s} className={scheme === s ? 'is-active' : ''} onClick={() => applyScheme(s)}>{t(l)}</button>
              ))}
            </div></div>
          </div>
        )}

        {config.features.languageSwitcher && (
          <div className="settings-group"><div className="settings-group__label">{t('profile.language')}</div>
            <div className="list">
              {availableLocales().map((l) => (
                <button key={l.code} className="list-row" onClick={() => chooseLang(l.code)}>
                  <span className="list-row__icon"><Icon name="globe" size={20} /></span>
                  <span className="list-row__text"><span className="list-row__title">{l.name}</span></span>
                  {locale === l.code && <Icon name="check" size={20} className="text-accent" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="settings-group"><div className="settings-group__label">{t('settings.currency')}</div>
          <div className="list"><div className="list-row">
            <span className="list-row__icon"><Icon name="tag" size={20} /></span>
            <span className="list-row__text"><span className="list-row__title">{currencyName}</span><span className="list-row__sub">{config.currency.code} · {config.currency.symbol}</span></span>
          </div></div>
        </div>

        <div className="settings-group"><div className="settings-group__label">{t('settings.notifications')}</div>
          <div className="list">
            {config.features.notifications && (
              <div className="list-row"><span className="list-row__text"><span className="list-row__title">{t('settings.order_notifications')}</span></span>
                <label className="switch"><input type="checkbox" aria-label={t('settings.order_notifications')} checked={prefs.notifications !== false} onChange={(e) => setPrefs((p) => ({ ...p, notifications: e.target.checked }))} /><span className="switch__track" /></label></div>
            )}
            <div className="list-row"><span className="list-row__text"><span className="list-row__title">{t('settings.promotions')}</span></span>
              <label className="switch"><input type="checkbox" aria-label={t('settings.promotions')} checked={Boolean(prefs.marketing)} onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))} /><span className="switch__track" /></label></div>
          </div>
        </div>
      </main>

      <TabBar activeTab="profile" />
    </>
  );
}
