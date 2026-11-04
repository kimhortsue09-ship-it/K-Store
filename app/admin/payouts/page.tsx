'use client';
/**
 * Admin payouts — available balance, request a payout, and settlement history.
 * Mirrors admin/payouts.js: a balance card + "Request payout" sheet (amount + destination,
 * validated), a history list whose rows open an in-page detail view (amount breakdown,
 * destination, timeline, statement download). All in-memory demo state.
 */
import { useState } from 'react';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

type PayoutStatus = 'paid' | 'pending' | 'failed';
interface Payout { id: string; amount: number; dest: string; status: PayoutStatus; date: string }

const SEED: Payout[] = [
  { id: 'PO-1180', amount: 1200, dest: 'Bank ••4471', status: 'paid', date: '2024-06-28T00:00:00Z' },
  { id: 'PO-1173', amount: 950, dest: 'Bank ••4471', status: 'paid', date: '2024-06-14T00:00:00Z' },
  { id: 'PO-1166', amount: 1500, dest: 'Bank ••4471', status: 'paid', date: '2024-05-31T00:00:00Z' },
];
const CLS: Record<PayoutStatus, string> = { paid: 'delivered', pending: 'pending', failed: 'cancelled' };
const DESTS = ['Bank ••4471', 'PayPal · store@nova.app'];

interface Breakdown { fee: number; gross: number; orders: number; arrival: string }
function breakdown(p: Payout): Breakdown {
  const fee = Math.round((p.amount * 0.029 + 0.3) * 100) / 100;
  const gross = Math.round((p.amount + fee) * 100) / 100;
  const orders = Math.max(1, Math.round(p.amount / 85));
  const arrival = new Date(p.date);
  arrival.setDate(arrival.getDate() + 2);
  return { fee, gross, orders, arrival: arrival.toISOString() };
}

function Timeline({ status }: { status: PayoutStatus }) {
  const steps: [string, string][] = [
    ['requested', 'Payout requested'],
    ['transit', 'In transit'],
    ['paid', 'Deposited'],
  ];
  const reached = status === 'paid' ? 2 : status === 'failed' ? 0 : 1;
  return (
    <div className="timeline">
      {steps.map(([key, label], i) => (
        <div key={key} className={`timeline__step ${i <= reached ? 'is-done' : ''}`}>
          <span className="timeline__dot" />
          <div>
            <div className="semibold">{label}</div>
            <div className="muted text-sm">{i <= reached ? 'Completed' : 'Pending'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPayoutsPage() {
  const [available, setAvailable] = useState(3480.5);
  const [history, setHistory] = useState<Payout[]>(SEED);
  const [openId, setOpenId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [amt, setAmt] = useState('');
  const [dest, setDest] = useState(DESTS[0]);

  const openRequest = () => {
    setAmt(available.toFixed(2));
    setDest(DESTS[0]);
    setRequesting(true);
    haptic('selection');
  };

  const submitRequest = () => {
    const val = parseFloat(amt);
    if (!val || val <= 0 || val > available) {
      toast('Enter a valid amount', { kind: 'danger' });
      haptic('error');
      return;
    }
    setHistory((prev) => [
      { id: 'PO-' + (1181 + prev.length), amount: val, dest, status: 'pending', date: new Date().toISOString() },
      ...prev,
    ]);
    setAvailable((a) => Math.max(0, a - val));
    haptic('success');
    setRequesting(false);
    toast('Payout requested', { kind: 'success' });
  };

  const selected = openId ? history.find((p) => p.id === openId) ?? null : null;

  if (selected) {
    const b = breakdown(selected);
    const details: [string, string][] = [
      ['Payout ID', selected.id],
      ['Destination', selected.dest],
      ['Requested', formatDate(selected.date)],
      ['Method', 'Standard (2 days)'],
      ['Orders included', `${b.orders}`],
    ];
    return (
      <>
        <header className="appbar admin-appbar">
          <button className="appbar__btn" aria-label="Back" onClick={() => setOpenId(null)}><Icon name="back" size={22} /></button>
          <h1 className="appbar__title">{selected.id}</h1>
          <div className="appbar__actions">
            <button className="appbar__btn" aria-label="Statement" onClick={() => toast('Statement downloaded (demo)', { kind: 'success' })}><Icon name="download" size={22} /></button>
          </div>
        </header>
        <main className="screen">
          <div className="chart-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{formatPrice(selected.amount)}</div>
            <div style={{ marginTop: 8 }}><span className={`status status--${CLS[selected.status]}`}>{selected.status}</span></div>
            <div className="muted text-sm" style={{ marginTop: 8 }}>{selected.status === 'paid' ? 'Arrived' : 'Expected'} {formatDate(b.arrival)}</div>
          </div>

          <div className="admin-section-title">Details</div>
          <div className="card card--pad">
            {details.map(([l, v]) => (
              <div key={l} className="row-between" style={{ padding: '8px 0' }}>
                <span className="muted text-sm">{l}</span>
                <span className="semibold">{v}</span>
              </div>
            ))}
          </div>

          <div className="admin-section-title">Breakdown</div>
          <div className="card">
            <div className="summary">
              <div className="summary__row"><span>Gross sales</span><span>{formatPrice(b.gross)}</span></div>
              <div className="summary__row summary__row--discount"><span>Processing fees</span><span>-{formatPrice(b.fee)}</span></div>
              <div className="summary__row summary__row--total"><span>Net payout</span><span>{formatPrice(selected.amount)}</span></div>
            </div>
          </div>

          <div className="admin-section-title">Status</div>
          <div className="card"><div style={{ padding: '8px 16px' }}><Timeline status={selected.status} /></div></div>
          <div className="container"><Link className="btn btn--outline btn--block" href="/admin/transactions"><Icon name="card" size={18} /> View included transactions</Link></div>
          <div style={{ height: 8 }} />
        </main>
        <AdminTabBar active="dashboard" />
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Payouts" back="/admin" />
      <main className="screen">
        <div className="chart-card" style={{ textAlign: 'center' }}>
          <div className="muted text-sm">Available for payout</div>
          <div style={{ fontSize: 34, fontWeight: 700, margin: '6px 0' }}>{formatPrice(available)}</div>
          <div className="muted text-sm">Next automatic payout: Friday</div>
        </div>
        <div className="container"><button className="btn btn--block" onClick={openRequest}><Icon name="download" size={18} /> Request payout</button></div>
        <div className="admin-section-title">Payout history</div>
        <div className="list" style={{ marginTop: 0 }}>
          {history.map((p) => (
            <button key={p.id} className="data-row" onClick={() => { setOpenId(p.id); haptic('selection'); }}>
              <span className="data-row__avatar">🏦</span>
              <span className="data-row__main">
                <span className="data-row__title">{formatPrice(p.amount)}</span>
                <span className="data-row__sub">{p.dest} · {p.id} · {formatDate(p.date)}</span>
              </span>
              <span className="data-row__end">
                <span className={`status status--${CLS[p.status]}`}>{p.status}</span>
                <Icon name="chevron" size={18} className="text-faint" />
              </span>
            </button>
          ))}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {requesting && (
        <Sheet title="Request payout" onClose={() => setRequesting(false)}>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div className="muted text-sm">Available</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatPrice(available)}</div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="payout-amount">Payout amount</label>
            <input id="payout-amount" className="input" type="number" min="0" step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="payout-dest">Destination</label>
            <select id="payout-dest" className="select" value={dest} onChange={(e) => setDest(e.target.value)}>
              {DESTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn--block" onClick={submitRequest}>Request payout</button>
        </Sheet>
      )}
    </>
  );
}
