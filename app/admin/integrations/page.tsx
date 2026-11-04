'use client';
/**
 * Admin integrations — connect/disconnect third-party services (payments, marketing,
 * automation, messaging). Mirrors the HTML kit's integrations.js structure. Connection state
 * persists under `nova:integrations` (same key as the HTML kit); wire to your backend/OAuth
 * in production. Uses admin.css.
 */
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const NS = config.data.persistNamespace;

interface Integ { id: string; emoji: string; name: string; desc: string }
interface Group { title: string; items: Integ[] }

const GROUPS: Group[] = [
  { title: 'Payments', items: [
    { id: 'stripe', emoji: '💳', name: 'Stripe', desc: 'Cards, wallets & subscriptions' },
    { id: 'paypal', emoji: '🅿️', name: 'PayPal', desc: 'PayPal & Pay Later' },
    { id: 'crypto', emoji: '🪙', name: 'Crypto Gateway', desc: 'BTC, ETH, USDT payments' },
  ] },
  { title: 'Marketing & Analytics', items: [
    { id: 'ga', emoji: '📈', name: 'Google Analytics', desc: 'Track traffic & conversions' },
    { id: 'mailchimp', emoji: '📧', name: 'Mailchimp', desc: 'Email campaigns & lists' },
    { id: 'meta', emoji: '📘', name: 'Meta Pixel', desc: 'Facebook & Instagram ads' },
  ] },
  { title: 'Automation', items: [
    { id: 'webhooks', emoji: '🔗', name: 'Webhooks', desc: 'POST order events to your URL' },
    { id: 'zapier', emoji: '⚡', name: 'Zapier', desc: 'Connect 5,000+ apps' },
  ] },
  { title: 'Messaging', items: [
    { id: 'bot', emoji: '🤖', name: 'Telegram Bot', desc: 'Order alerts & broadcasts' },
  ] },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);
const AVAILABLE = ALL_ITEMS.length;

export default function AdminIntegrationsPage() {
  const [state, setState] = usePersistentState<Record<string, boolean>>(`${NS}:integrations`, {});

  const connected = Object.values(state).filter(Boolean).length;

  const toggle = (it: Integ) => {
    const next = !state[it.id];
    setState((prev) => ({ ...prev, [it.id]: next }));
    haptic(next ? 'success' : 'medium');
    toast(`${it.name} ${next ? 'connected' : 'disconnected'}`, { kind: next ? 'success' : 'default' });
  };

  return (
    <>
      <AdminHeader title="Integrations" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi">
            <span className="kpi__label"><span className="kpi__icon"><Icon name="plug" size={18} /></span>Connected</span>
            <span className="kpi__value">{connected}</span>
          </div>
          <div className="kpi">
            <span className="kpi__label"><span className="kpi__icon"><Icon name="check" size={18} /></span>Available</span>
            <span className="kpi__value">{AVAILABLE}</span>
          </div>
        </div>

        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="admin-section-title">{g.title}</div>
            <div className="integration-list">
              {g.items.map((it) => {
                const on = Boolean(state[it.id]);
                return (
                  <div key={it.id} className="integration-item">
                    <span className="integration-icon">{it.emoji}</span>
                    <span className="integration-info">
                      <span className="integration-name">
                        {it.name}
                        {on && <span className="status status--delivered" style={{ marginInlineStart: 6 }}>Connected</span>}
                      </span>
                      <span className="integration-desc">{it.desc}</span>
                    </span>
                    <button
                      className={`connect-btn ${on ? 'connected' : 'enabled'}`}
                      onClick={() => toggle(it)}
                    >
                      {on ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
      <AdminTabBar active="dashboard" />
    </>
  );
}
