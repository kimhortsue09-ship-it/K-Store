'use client';
/**
 * Admin payments — toggle checkout methods + hold each rail's PUBLISHABLE settings
 * (Telegram Stars, TON Connect, Stripe). Demo only — secrets stay on your server. Uses admin.css.
 */
import { useState } from 'react';
import { config } from '@/config';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Switch } from '@/components/Switch';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const PROVIDER_LABEL: Record<string, string> = { telegramStars: 'Telegram Stars', tonConnect: 'TON Connect', stripe: 'Stripe', manual: 'Manual / COD' };

type ProviderState = {
  s_url: string; s_rate: string;
  t_manifest: string; t_addr: string; t_rate: string;
  st_mode: 'checkout' | 'paymentLink'; st_pk: string; st_url: string; st_link: string; st_ctry: string;
};

export default function AdminPaymentsPage() {
  const p = config.payments.providers;
  const [methods, setMethods] = useState(config.payments.methods.map((m) => ({ ...m })));
  const [fields, setFields] = useState<ProviderState>({
    s_url: p.telegramStars.createInvoiceUrl,
    s_rate: String(p.telegramStars.starsPerUnit ?? ''),
    t_manifest: p.tonConnect.manifestUrl,
    t_addr: p.tonConnect.recipientAddress,
    t_rate: String(p.tonConnect.tonPerUnit ?? ''),
    st_mode: p.stripe.mode,
    st_pk: p.stripe.publishableKey,
    st_url: p.stripe.checkoutUrl,
    st_link: p.stripe.paymentLinkUrl,
    st_ctry: p.stripe.supportedCountries.join(', '),
  });

  const set = <K extends keyof ProviderState>(key: K, value: ProviderState[K]) => setFields((f) => ({ ...f, [key]: value }));

  const toggle = (id: string) => {
    setMethods((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const enabled = !m.enabled;
      toast(`${m.label} ${enabled ? 'enabled' : 'disabled'}`);
      return { ...m, enabled };
    }));
  };

  const save = () => { haptic('success'); toast('Payments saved (demo) — persist to config.ts to apply', { kind: 'success' }); };

  const field = (id: keyof ProviderState, label: string, placeholder = '') => (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input className="input" id={id} value={fields[id]} onChange={(e) => set(id, e.target.value as ProviderState[typeof id])} placeholder={placeholder} autoComplete="off" />
    </div>
  );

  return (
    <>
      <AdminHeader title="Payments" back="/admin" />
      <main className="screen">
        <div className="admin-section-title">Checkout methods</div>
        <div className="list" style={{ marginTop: 0 }}>
          {methods.map((m) => (
            <div key={m.id} className="list-row">
              <span className="list-row__icon">{m.icon}</span>
              <span className="list-row__text">
                <span className="list-row__title">{m.label}</span>
                <span className="list-row__sub">{PROVIDER_LABEL[m.provider] || m.provider} · {m.enabled ? 'Active' : 'Disabled'}</span>
              </span>
              <Switch checked={m.enabled} onChange={() => toggle(m.id)} />
            </div>
          ))}
        </div>

        <div className="admin-section-title">{PROVIDER_LABEL.telegramStars}</div>
        <div className="container" style={{ paddingTop: 0 }}>
          {field('s_url', 'Create-invoice endpoint', 'https://yourapi.com/tg/invoice')}
          {field('s_rate', `Stars per 1 ${config.currency.code}`, '50')}
        </div>

        <div className="admin-section-title">{PROVIDER_LABEL.tonConnect}</div>
        <div className="container" style={{ paddingTop: 0 }}>
          {field('t_manifest', 'Manifest URL', 'https://yourapp.com/tonconnect-manifest.json')}
          {field('t_addr', 'Recipient wallet address', 'UQ…')}
          {field('t_rate', `TON per 1 ${config.currency.code}`, '0.25')}
        </div>

        <div className="admin-section-title">{PROVIDER_LABEL.stripe}</div>
        <div className="container" style={{ paddingTop: 0 }}>
          <div className="field">
            <label className="field__label" htmlFor="st_mode">Mode</label>
            <select className="select" id="st_mode" value={fields.st_mode} onChange={(e) => set('st_mode', e.target.value as ProviderState['st_mode'])}>
              <option value="checkout">Hosted Checkout (backend session)</option>
              <option value="paymentLink">Payment Link (fixed URL)</option>
            </select>
          </div>
          {field('st_pk', 'Publishable key', 'pk_live_…')}
          {field('st_url', 'Checkout endpoint', 'https://yourapi.com/stripe/checkout')}
          {field('st_link', 'Payment Link URL', 'https://buy.stripe.com/…')}
          {field('st_ctry', 'Supported countries (ISO, comma-sep)', 'US, CA, GB')}
        </div>

        <div className="container" style={{ paddingTop: 0 }}>
          <p className="muted text-sm">
            <Icon name="info" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            These are demo controls. Keep secret keys (Stripe secret key, bot token) on your server — the client only holds publishable values and endpoints.
          </p>
        </div>

        <div className="bottom-bar">
          <button className="btn btn--block" onClick={save}>Save payments</button>
        </div>
      </main>
      <AdminTabBar active="dashboard" />
    </>
  );
}
