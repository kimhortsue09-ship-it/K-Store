'use client';
/** Language — faithful port: current-language card, radio list with flags, Apply. Uses languages.css. */
import '../../styles/pages/languages.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { currentLocale, setLocale, t } from '@/lib/i18n';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';

const META: Record<string, { flag: string; native: string; english: string }> = {
  en: { flag: '🇬🇧', native: 'English', english: 'English' },
  es: { flag: '🇪🇸', native: 'Español', english: 'Spanish' },
  ar: { flag: '🇸🇦', native: 'العربية', english: 'Arabic' },
  fr: { flag: '🇫🇷', native: 'Français', english: 'French' },
  de: { flag: '🇩🇪', native: 'Deutsch', english: 'German' },
};

export default function LanguagePage() {
  const router = useRouter();
  const [active, setActive] = useState(currentLocale());
  const [selected, setSelected] = useState(active);
  const meta = (c: string) => META[c] || { flag: '🌐', native: c.toUpperCase(), english: c };
  const cur = meta(active);

  const apply = () => {
    setLocale(selected);
    document.documentElement.setAttribute('dir', config.locale.rtlLocales.includes(selected) ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', selected);
    haptic('success');
    toast(t('settings.language_updated'), { kind: 'success' });
    setActive(selected); // re-render in the new language (the HTML kit re-renders too)
  };

  return (
    <>
      <header className="languages-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('profile.language')}</h1></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="languages-content">
          <div className="current-language-section">
            <div className="section-title">{t('language.current')}</div>
            <div className="current-language-card">
              <span className="language-flag">{cur.flag}</span>
              <div><div className="language-name">{cur.native}</div><div className="language-subtitle">{cur.english}</div></div>
              <span className="current-indicator"><Icon name="check" size={22} /></span>
            </div>
          </div>

          <div className="language-options-section">
            <div className="section-title">{t('language.all')}</div>
            <div className="languages-list">
              {config.locale.available.map((code) => {
                const m = meta(code);
                return (
                  <div key={code} role="button" tabIndex={0} aria-label={m.english} className={`language-item${selected === code ? ' selected' : ''}`} onClick={() => { setSelected(code); haptic('selection'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(code); haptic('selection'); } }}>
                    <span className="language-flag">{m.flag}</span>
                    <div className="language-details"><div className="language-name">{m.native}</div><div className="language-subtitle">{m.english}</div></div>
                    <span className="language-radio" />
                  </div>
                );
              })}
            </div>
            <div className="apply-section">
              <button className="btn btn--block" onClick={apply}>{t('action.apply')}</button>
              <div className="apply-note">{t('language.apply_note')}</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
