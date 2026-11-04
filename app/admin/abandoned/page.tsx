'use client';
/**
 * Admin abandoned carts — recoverable carts with a one-tap reminder.
 * Mirrors admin/abandoned.js: each cart's Remind button flips to "Sent" (in-memory state),
 * plus a header "Remind all" action. Toast + haptic feedback.
 */
import { useState } from 'react';
import { DEMO_ABANDONED } from '@/lib/admin';
import { formatPrice, formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

interface Cart { id: string; customer: string; handle: string; items: number; value: number; updated: string; reminded: boolean }
const initials = (n: string) => (n === 'Guest' ? '👤' : n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase());

export default function AdminAbandonedPage() {
  const [carts, setCarts] = useState<Cart[]>(() => DEMO_ABANDONED.map((c) => ({ ...c, reminded: false })));
  const total = carts.reduce((s, c) => s + c.value, 0);

  const remind = (id: string) => {
    const c = carts.find((x) => x.id === id);
    if (!c || c.reminded) return;
    setCarts((prev) => prev.map((x) => (x.id === id ? { ...x, reminded: true } : x)));
    haptic('success');
    toast(`Reminder sent to ${c.customer}`, { kind: 'success' });
  };
  const remindAll = () => {
    setCarts((prev) => prev.map((x) => ({ ...x, reminded: true })));
    haptic('success');
    toast('Reminders sent to all', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader title="Abandoned Carts" back="/admin" actions={<button className="appbar__btn" aria-label="Remind all" onClick={remindAll}><Icon name="send" size={22} /></button>} />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="cart" size={18} /></span>Abandoned</span><span className="kpi__value">{carts.length}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="card" size={18} /></span>Recoverable</span><span className="kpi__value">{formatPrice(total)}</span></div>
        </div>
        <div className="admin-section-title">Carts</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {carts.map((c) => (
            <div key={c.id} className="data-row">
              <span className="data-row__avatar">{initials(c.customer)}</span>
              <span className="data-row__main"><span className="data-row__title">{c.customer}</span><span className="data-row__sub">{c.items} item(s) · {formatDate(c.updated)}</span></span>
              <span className="data-row__end"><span className="semibold">{formatPrice(c.value)}</span><button className={`btn btn--sm ${c.reminded ? 'btn--outline' : 'btn--ghost'}`} onClick={() => remind(c.id)} disabled={c.reminded}>{c.reminded ? 'Sent' : 'Remind'}</button></span>
            </div>
          ))}
        </div>
      </main>
      <AdminTabBar active="orders" />
    </>
  );
}
