'use client';
/** Admin activity log — staff audit feed, filter by area. Uses admin.css. */
import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';
import { haptic } from '@/lib/telegram';

const AREA: Record<string, { icon: string; tint: string }> = {
  order: { icon: 'bag', tint: 'tint-blue' },
  product: { icon: 'box', tint: 'tint-green' },
  customer: { icon: 'user', tint: 'tint-purple' },
  payout: { icon: 'card', tint: 'tint-orange' },
  settings: { icon: 'gear', tint: 'tint-pink' },
};
const LOG = [
  { area: 'order', actor: 'Ada N.', action: 'marked order NV-1042 as shipped', date: '2024-06-28T14:20:00Z' },
  { area: 'product', actor: 'You', action: 'updated price of “Wireless Headphones”', date: '2024-06-28T11:05:00Z' },
  { area: 'customer', actor: 'Ada N.', action: 'issued a $10 credit to Marco Diaz', date: '2024-06-27T16:40:00Z' },
  { area: 'payout', actor: 'System', action: 'sent payout PO-1180 to Bank ••4471', date: '2024-06-28T09:00:00Z' },
  { area: 'settings', actor: 'You', action: 'enabled the loyalty program', date: '2024-06-26T18:12:00Z' },
  { area: 'product', actor: 'You', action: 'added “Productivity Course” to Staff Picks', date: '2024-06-26T10:30:00Z' },
  { area: 'order', actor: 'System', action: 'auto-cancelled unpaid order NV-1039', date: '2024-06-25T08:00:00Z' },
  { area: 'customer', actor: 'Ada N.', action: 'answered a product question', date: '2024-06-24T13:15:00Z' },
];
const time = (d: string) => { const s = new Date(d); return `${formatDate(d)} · ${String(s.getUTCHours()).padStart(2, '0')}:${String(s.getUTCMinutes()).padStart(2, '0')}`; };

export default function AdminActivityPage() {
  const [filter, setFilter] = useState('all');
  const list = LOG.filter((e) => filter === 'all' || e.area === filter);

  return (
    <>
      <AdminHeader title="Activity log" back="/admin" />
      <main className="screen">
        <div className="tabs-pill">{[['all', 'All'], ['order', 'Orders'], ['product', 'Products'], ['customer', 'Customers'], ['payout', 'Payouts'], ['settings', 'Settings']].map(([k, l]) => <button key={k} className={`chip${k === filter ? ' is-active' : ''}`} onClick={() => { haptic('selection'); setFilter(k); }}>{l}</button>)}</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {list.length ? list.map((e, i) => {
            const a = AREA[e.area];
            return (
              <div key={i} className="data-row">
                <span className={`data-row__avatar ${a.tint}`}><Icon name={a.icon} size={20} /></span>
                <span className="data-row__main"><span className="data-row__title"><strong>{e.actor}</strong> {e.action}</span><span className="data-row__sub">{time(e.date)}</span></span>
              </div>
            );
          }) : <p className="muted text-sm">No activity in this area.</p>}
        </div>
      </main>
      <AdminTabBar active="dashboard" />
    </>
  );
}
