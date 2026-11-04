'use client';
/**
 * Admin returns & refunds — mirrors admin/returns.js. Reads/writes the SAME `nova:returns` key the
 * customer returns page writes to, so shopper-submitted requests land here. Status filter tabs, a
 * "requests awaiting review" banner, and banner cards with inline Approve / Reject (on `requested`)
 * and Issue refund (on `approved`) actions. Tapping a card also opens a detail sheet with the same
 * actions. Approve/reject apply immediately (as in the HTML); the irreversible refund confirms first.
 */
import { useState } from 'react';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const NS = config.data.persistNamespace;

type ReturnStatus = 'requested' | 'approved' | 'refunded' | 'rejected';
interface Ret { id: string; orderNumber: string; item: string; reason: string; status: ReturnStatus; date: string; note?: string }

const STATUS_CLS: Record<ReturnStatus, string> = { requested: 'pending', approved: 'shipped', refunded: 'delivered', rejected: 'cancelled' };
const STATUSES = ['all', 'requested', 'approved', 'refunded', 'rejected'] as const;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Same demo rows the HTML seeds when `nova:returns` is empty (admin/returns.js:22-28). */
const SEED: Ret[] = [
  { id: 'ret-demo1', orderNumber: 'NV-1002', item: 'Pulse Smart Watch', reason: 'Damaged or defective', status: 'requested', date: '2024-07-03T08:00:00Z' },
  { id: 'ret-demo2', orderNumber: 'NV-0998', item: 'Terra Field Jacket', reason: 'Wrong item received', status: 'approved', date: '2024-06-29T12:00:00Z' },
];

export default function AdminReturnsPage() {
  const [returns, setReturns] = usePersistentState<Ret[]>(`${NS}:returns`, SEED);
  const [filter, setFilter] = useState<string>('all');
  const [active, setActive] = useState<Ret | null>(null);

  const list = returns.filter((r) => filter === 'all' || r.status === filter);
  const pending = returns.filter((r) => r.status === 'requested').length;

  const setStatus = (id: string, status: ReturnStatus) => {
    setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setActive((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
    haptic('success');
    toast(`Return ${status}`, { kind: status === 'rejected' ? 'danger' : 'success' });
  };

  const approve = (r: Ret) => setStatus(r.id, 'approved');
  const reject = (r: Ret) => setStatus(r.id, 'rejected');
  const refund = async (r: Ret) => {
    if (await tgConfirm(`Issue a refund for ${r.item}? This cannot be undone.`)) setStatus(r.id, 'refunded');
  };

  return (
    <>
      <AdminHeader title="Returns" back="/admin" />
      <main className="screen">
        {pending > 0 && (
          <div className="card card--pad row gap-2" style={{ color: 'var(--warning)' }}>
            <Icon name="bell" size={18} /> {pending} request{pending > 1 ? 's' : ''} awaiting review
          </div>
        )}
        <div className="tabs-pill">
          {STATUSES.map((s) => (
            <button key={s} className={`chip${s === filter ? ' is-active' : ''}`} onClick={() => { setFilter(s); haptic('selection'); }}>{cap(s)}</button>
          ))}
        </div>
        {list.length ? list.map((r) => (
          <div key={r.id} className="card card--pad" style={{ marginBottom: 12 }}>
            <div className="row-between">
              <button
                className="grow"
                style={{ textAlign: 'start' }}
                onClick={() => { setActive(r); haptic('selection'); }}
              >
                <div className="semibold">{r.item}</div>
                <div className="muted text-sm">Order {r.orderNumber} · {r.reason} · {formatDate(r.date)}</div>
              </button>
              <span className={`status status--${STATUS_CLS[r.status]}`}>{r.status}</span>
            </div>
            {r.status === 'requested' && (
              <div className="row gap-2" style={{ marginTop: 12 }}>
                <button className="btn btn--sm" onClick={() => approve(r)}>Approve</button>
                <button className="btn btn--sm btn--outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => reject(r)}>Reject</button>
              </div>
            )}
            {r.status === 'approved' && (
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn btn--sm" onClick={() => void refund(r)}><Icon name="card" size={16} /> Issue refund</button>
              </div>
            )}
          </div>
        )) : (
          <div className="empty-state"><div className="empty-state__emoji">📦</div><h3>No {filter === 'all' ? '' : filter + ' '}returns</h3></div>
        )}
      </main>
      <AdminTabBar active="orders" />

      {active && (
        <Sheet title="Return request" onClose={() => setActive(null)}>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div>
              <div className="semibold">{active.item}</div>
              <div className="muted text-sm">Order {active.orderNumber} · {formatDate(active.date)}</div>
            </div>
            <span className={`status status--${STATUS_CLS[active.status]}`}>{active.status}</span>
          </div>
          <div className="summary" style={{ padding: 0, marginBottom: 16 }}>
            <div className="summary__row"><span>Reason</span><span>{active.reason}</span></div>
            <div className="summary__row"><span>Status</span><span>{cap(active.status)}</span></div>
            {active.note ? <div className="summary__row"><span>Note</span><span>{active.note}</span></div> : null}
          </div>
          {active.status === 'requested' && (
            <div className="row gap-2">
              <button className="btn btn--block" onClick={() => approve(active)}>Approve</button>
              <button className="btn btn--block btn--outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => reject(active)}>Reject</button>
            </div>
          )}
          {active.status === 'approved' && (
            <button className="btn btn--block" onClick={() => void refund(active)}><Icon name="card" size={16} /> Issue refund</button>
          )}
          {(active.status === 'refunded' || active.status === 'rejected') && (
            <p className="muted text-sm" style={{ textAlign: 'center' }}>This request is closed.</p>
          )}
        </Sheet>
      )}
    </>
  );
}
