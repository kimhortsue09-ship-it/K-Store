'use client';
/**
 * Admin transactions — faithful port of admin/transactions.js: every money movement through the
 * store (payments, refunds, payouts) with KPIs (gross / refunds / net / count) and kind filters.
 * Demo ledger; wire to your payment provider in production. Uses admin.css.
 */
import { useState } from 'react';
import { formatPrice, formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

type Kind = 'payment' | 'refund' | 'payout';
interface Tx { id: string; kind: Kind; title: string; who: string; amount: number; status: string; date: string }

const TX: Tx[] = [
  { id: 'CH-9012', kind: 'payment', title: 'Order NV-0915', who: 'Kenji Tanaka', amount: 699.0, status: 'completed', date: '2024-07-01T18:22:00Z' },
  { id: 'CH-9011', kind: 'payment', title: 'Order NV-0914', who: 'Sofia Marín', amount: 59.0, status: 'completed', date: '2024-06-30T09:05:00Z' },
  { id: 'RF-2201', kind: 'refund', title: 'Refund NV-0902', who: 'Liam Brooks', amount: -74.0, status: 'completed', date: '2024-06-29T13:10:00Z' },
  { id: 'CH-9010', kind: 'payment', title: 'Order NV-0913', who: 'Liam Brooks', amount: 149.0, status: 'completed', date: '2024-06-29T14:40:00Z' },
  { id: 'PO-1180', kind: 'payout', title: 'Payout to bank ••4471', who: 'You', amount: -1200.0, status: 'paid', date: '2024-06-28T00:00:00Z' },
  { id: 'CH-9009', kind: 'payment', title: 'Order NV-0912', who: 'Amara Okafor', amount: 178.0, status: 'completed', date: '2024-06-28T10:12:00Z' },
];
const CLS: Record<string, string> = { completed: 'delivered', paid: 'delivered', pending: 'pending', failed: 'cancelled' };
const ICON: Record<Kind, string> = { payment: '💰', refund: '↩️', payout: '🏦' };
const FILTERS: [string, string][] = [['all', 'All'], ['payment', 'Payments'], ['refund', 'Refunds'], ['payout', 'Payouts']];

export default function AdminTransactionsPage() {
  const [filter, setFilter] = useState('all');
  const list = TX.filter((t) => filter === 'all' || t.kind === filter);
  const gross = TX.filter((t) => t.kind === 'payment').reduce((s, t) => s + t.amount, 0);
  const refunds = -TX.filter((t) => t.kind === 'refund').reduce((s, t) => s + t.amount, 0);

  const changeFilter = (f: string) => { setFilter(f); haptic('selection'); };
  const exportCsv = () => { haptic('success'); toast('Ledger exported as CSV (demo)', { kind: 'success' }); };

  return (
    <>
      <AdminHeader title="Transactions" back="/admin" actions={<button className="appbar__btn" aria-label="Export" onClick={exportCsv}><Icon name="download" size={22} /></button>} />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="card" size={18} /></span>Gross</span><span className="kpi__value">{formatPrice(gross)}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="box" size={18} /></span>Refunds</span><span className="kpi__value">{formatPrice(refunds)}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="chart" size={18} /></span>Net</span><span className="kpi__value">{formatPrice(gross - refunds)}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="bag" size={18} /></span>Count</span><span className="kpi__value">{TX.length}</span></div>
        </div>

        <div className="tabs-pill">
          {FILTERS.map(([k, l]) => <button key={k} className={`chip${k === filter ? ' is-active' : ''}`} onClick={() => changeFilter(k)}>{l}</button>)}
        </div>

        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {list.map((t) => {
            const inb = t.amount >= 0;
            return (
              <div key={t.id} className="data-row">
                <span className="data-row__avatar">{ICON[t.kind]}</span>
                <span className="data-row__main">
                  <span className="data-row__title">{t.title}</span>
                  <span className="data-row__sub">{t.who} · {t.id} · {formatDate(t.date)}</span>
                </span>
                <span className="data-row__end">
                  <span className="semibold" style={{ color: inb ? 'var(--success)' : 'var(--text)' }}>{inb ? '+' : '−'}{formatPrice(Math.abs(t.amount))}</span>
                  <span className={`status status--${CLS[t.status]}`}>{t.status}</span>
                </span>
              </div>
            );
          })}
        </div>
      </main>
      <AdminTabBar active="dashboard" />
    </>
  );
}
