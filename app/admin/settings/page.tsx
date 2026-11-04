'use client';
/**
 * Admin store settings — mirrors the HTML kit (assets/js/admin/settings.js):
 * Store profile · Appearance (Light/Dark/Auto segmented) · Currency & tax · Features flags.
 * Values seed from config; save shows a toast + haptic (demo only — wire to a backend to persist).
 */
import { useEffect, useState } from 'react';
import { config } from '@/config';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Switch } from '@/components/Switch';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';

type Scheme = 'light' | 'dark' | 'auto';

const THEME_KEY = `${config.data.persistNamespace}:theme`;

function Field({ label, id, value, onChange, type = 'text', min, step }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  type?: string; min?: string; step?: string;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input
        className="input"
        id={id}
        type={type}
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [store, setStore] = useState({
    name: config.brand.name,
    tagline: config.brand.tagline,
    support: config.brand.supportUrl || '',
    ccode: config.currency.code,
    symbol: config.currency.symbol,
    tax: String(config.commerce.taxRate * 100),
    ship: String(config.commerce.shippingFlat),
    freeship: String(config.commerce.freeShippingThreshold),
  });
  const set = (k: keyof typeof store) => (v: string) => setStore((s) => ({ ...s, [k]: v }));

  const [flags, setFlags] = useState<Record<string, boolean>>({ ...config.features });

  const [scheme, setScheme] = useState<Scheme>('dark');
  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) as Scheme | null;
    setScheme(saved ?? (config.theme.colorScheme as Scheme) ?? 'dark');
  }, []);

  const pickScheme = (next: Scheme) => {
    setScheme(next);
    const resolved = next === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : next;
    document.documentElement.setAttribute('data-theme', resolved);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    haptic('selection');
  };

  const save = () => {
    haptic('success');
    toast('Settings saved (demo)', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader title="Store settings" back="/admin" />
      <main className="screen">
        <div className="admin-section-title">Store profile</div>
        <div className="container">
          <Field label="Store name" id="s_name" value={store.name} onChange={set('name')} />
          <Field label="Tagline" id="s_tagline" value={store.tagline} onChange={set('tagline')} />
          <Field label="Support URL" id="s_support" value={store.support} onChange={set('support')} />
        </div>

        <div className="admin-section-title">Appearance</div>
        <div className="card card--pad">
          <div className="segmented" id="themeSeg">
            <button type="button" className={scheme === 'light' ? 'is-active' : ''} onClick={() => pickScheme('light')}>☀️ Light</button>
            <button type="button" className={scheme === 'dark' ? 'is-active' : ''} onClick={() => pickScheme('dark')}>🌙 Dark</button>
            <button type="button" className={scheme === 'auto' ? 'is-active' : ''} onClick={() => pickScheme('auto')}>Auto</button>
          </div>
        </div>

        <div className="admin-section-title">Currency &amp; tax</div>
        <div className="container">
          <div className="form-grid">
            <Field label="Currency code" id="s_ccode" value={store.ccode} onChange={set('ccode')} />
            <Field label="Symbol" id="s_symbol" value={store.symbol} onChange={set('symbol')} />
          </div>
          <div className="form-grid">
            <Field label="Tax rate (%)" id="s_tax" type="number" min="0" step="0.1" value={store.tax} onChange={set('tax')} />
            <Field label="Flat shipping" id="s_ship" type="number" min="0" step="0.01" value={store.ship} onChange={set('ship')} />
          </div>
          <Field label="Free shipping over" id="s_freeship" type="number" min="0" step="1" value={store.freeship} onChange={set('freeship')} />
        </div>

        <div className="admin-section-title">Features</div>
        <div className="list">
          {Object.entries(flags).map(([key, on]) => (
            <div key={key} className="list-row">
              <span className="list-row__text"><span className="list-row__title">{key}</span></span>
              <Switch checked={on} onChange={(v) => setFlags((f) => ({ ...f, [key]: v }))} />
            </div>
          ))}
        </div>

        <p className="muted text-sm container" style={{ paddingBlock: 12 }}>
          <Icon name="info" size={14} /> Enable or disable storefront features here. In this demo,
          changes preview only — connect your backend to save them permanently.
        </p>
      </main>

      <div className="bottom-bar">
        <button className="btn btn--block" onClick={save}>Save settings</button>
      </div>
    </>
  );
}
