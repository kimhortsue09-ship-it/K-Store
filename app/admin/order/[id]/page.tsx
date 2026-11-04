'use client';
/**
 * Admin order detail — full management, ported from admin/order.js.
 * Status timeline, fulfilment (tracking), totals, customer / shipping / payment cards,
 * internal note, and actions (advance/set status, refund, cancel, contact, invoice).
 * Real orders (the shopper's, in the store) persist through `updateOrder()`; seeded demo
 * orders patch in memory only — exactly like the HTML `patch()` / `isReal()` pair.
 */
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { mergedOrders } from '@/lib/admin';
import { formatPrice, formatDate } from '@/lib/format';
import { productArt } from '@/lib/productArt';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { EmptyState } from '@/components/EmptyState';
import type { Order } from '@/lib/types';

type Status = Order['status'];
const FLOW: Status[] = ['pending', 'paid', 'shipped', 'delivered'];
const ALL_STATUSES: Status[] = [...FLOW, 'cancelled'];
const STEP_LABEL: Record<string, string> = {
  pending: 'Order placed',
  paid: 'Payment confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { orders: storeOrders, updateOrder } = useStore();

  /** Demo orders aren't in the store, so their edits live in memory (HTML: `Object.assign(order, data)`). */
  const [demoPatch, setDemoPatch] = useState<Partial<Order>>({});
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  // Sheets
  const [statusSheet, setStatusSheet] = useState(false);
  const [trackSheet, setTrackSheet] = useState(false);
  const [trackDraft, setTrackDraft] = useState('');

  const isReal = storeOrders.some((o) => o.id === id);
  const base = mergedOrders(storeOrders).find((o) => o.id === id);
  const order: Order | undefined = base && (isReal ? base : { ...base, ...demoPatch });

  if (!order) {
    return (
      <>
        <AdminHeader title="Order" back="/admin/orders" />
        <EmptyState emoji="🧐" title="Order not found" />
      </>
    );
  }

  /** Write through to the store for real orders; patch in memory for demo ones (order.js:23-27). */
  const patch = (data: Partial<Order>) => {
    if (isReal) updateOrder(order.id, data);
    else setDemoPatch((prev) => ({ ...prev, ...data }));
  };

  const items = order.items ?? [];
  const subtotal = order.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0);
  const t = {
    subtotal,
    discount: order.discount || 0,
    shipping: order.shipping || 0,
    tax: order.tax || 0,
    total: order.total ?? subtotal,
  };
  const a = order.address;
  const cur = order.status;

  const flowIndex = FLOW.indexOf(cur);
  const cancelled = cur === 'cancelled';
  const next: Status | null = flowIndex >= 0 && flowIndex < FLOW.length - 1 ? FLOW[flowIndex + 1] : null;

  const noteValue = noteDraft ?? order.adminNote ?? '';

  const setStatus = (s: Status) => {
    patch({ status: s });
    haptic('success');
    toast(`Order marked ${s}`, { kind: s === 'cancelled' ? 'danger' : 'success' });
  };

  const onAdvance = () => {
    if (next) setStatus(next);
  };

  const onContact = () => toast('Opening chat with customer (demo)');
  const onInvoice = () => toast('Invoice generated (demo)', { kind: 'success' });
  const onRefund = async () => {
    if (await tgConfirm(`Refund ${formatPrice(t.total)} to the customer?`)) {
      setStatus('cancelled');
      toast('Refund issued (demo)', { kind: 'success' });
    }
  };
  const onCancel = async () => {
    if (await tgConfirm('Cancel this order?')) setStatus('cancelled');
  };
  const onSaveNote = () => {
    patch({ adminNote: noteValue });
    haptic('success');
    toast('Note saved', { kind: 'success' });
  };

  const openTracking = () => {
    setTrackDraft(order.tracking ?? '');
    setTrackSheet(true);
  };
  /** An empty value intentionally CLEARS the tracking number (order.js:171). */
  const saveTracking = () => {
    const data: Partial<Order> = { tracking: trackDraft.trim() };
    if (cur === 'paid') data.status = 'shipped';
    patch(data);
    haptic('success');
    setTrackSheet(false);
    toast('Tracking saved', { kind: 'success' });
  };

  const pickStatus = (s: Status) => {
    setStatusSheet(false);
    setStatus(s);
  };

  return (
    <>
      <AdminHeader
        title={order.number}
        back="/admin/orders"
        actions={
          <button className="appbar__btn" aria-label="More" onClick={() => setStatusSheet(true)}>
            <Icon name="filter" size={22} />
          </button>
        }
      />
      {/* No tab bar on this screen (admin/order.html uses `screen--no-tabbar` + a fixed bottombar). */}
      <main className="screen screen--no-tabbar">
        <div className="card card--pad row-between">
          <div>
            <div className="muted text-sm">Placed {formatDate(order.createdAt)}</div>
            <div className="semibold" style={{ fontSize: 'var(--fs-lg)' }}>{formatPrice(t.total)}</div>
          </div>
          <span className={`status status--${cur}`}>{cur}</span>
        </div>

        <div className="quick-actions">
          <button className="quick-action" onClick={onContact}><span className="quick-action__icon"><Icon name="send" size={20} /></span>Contact</button>
          <button className="quick-action" onClick={onInvoice}><span className="quick-action__icon"><Icon name="box" size={20} /></span>Invoice</button>
          <button className="quick-action" onClick={onRefund}><span className="quick-action__icon"><Icon name="card" size={20} /></span>Refund</button>
          <button className="quick-action" onClick={onCancel}><span className="quick-action__icon"><Icon name="close" size={20} /></span>Cancel</button>
        </div>

        <div className="admin-section-title">Status</div>
        <div className="card">
          <div style={{ padding: '8px 16px' }}>
            <div className="timeline">
              {FLOW.map((s, i) => {
                const done = !cancelled && i <= flowIndex;
                return (
                  <div key={s} className={`timeline__step${done ? ' is-done' : ''}`}>
                    <span className="timeline__dot" />
                    <div>
                      <div className="semibold">{STEP_LABEL[s]}</div>
                      <div className="muted text-sm">{done ? formatDate(order.createdAt) : 'Pending'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-section-title">Fulfilment</div>
        <div className="card card--pad">
          <div className="row-between"><span className="muted text-sm">Method</span><span className="semibold">{order.shippingMethod || 'Standard'}</span></div>
          <div className="row-between" style={{ marginTop: 8 }}>
            <span className="muted text-sm">Tracking</span>
            <span className="semibold">{order.tracking ? order.tracking : <span className="text-faint">Not added</span>}</span>
          </div>
          <button className="btn btn--sm btn--ghost" style={{ marginTop: 12 }} onClick={openTracking}>{order.tracking ? 'Update' : 'Add'} tracking</button>
        </div>

        <div className="admin-section-title">Items ({items.length})</div>
        <div className="list" style={{ marginTop: 0 }}>
          {items.map((it) => (
            <div key={it.id} className="data-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="data-row__avatar" src={productArt(it)} alt="" width={40} height={40} />
              <span className="data-row__main">
                <span className="data-row__title">{it.name}</span>
                <span className="data-row__sub">Qty {it.qty} × {formatPrice(it.price)}</span>
              </span>
              <span className="semibold">{formatPrice(it.price * it.qty)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="summary">
            <div className="summary__row"><span>Subtotal</span><span>{formatPrice(t.subtotal)}</span></div>
            {t.discount > 0 && (
              <div className="summary__row summary__row--discount"><span>Discount</span><span>-{formatPrice(t.discount)}</span></div>
            )}
            <div className="summary__row"><span>Shipping</span><span>{t.shipping ? formatPrice(t.shipping) : 'Free'}</span></div>
            <div className="summary__row"><span>Tax</span><span>{formatPrice(t.tax)}</span></div>
            <div className="summary__row summary__row--total"><span>Total</span><span>{formatPrice(t.total)}</span></div>
          </div>
        </div>

        <div className="admin-section-title">Customer</div>
        <div className="card card--pad">
          <div className="semibold">{a?.name || 'Guest'}</div>
          {a?.phone && <div className="muted text-sm">{a.phone}</div>}
        </div>

        {a?.line1 && (
          <>
            <div className="admin-section-title">Shipping address</div>
            <div className="card card--pad">
              <div className="muted text-sm" style={{ lineHeight: 1.6 }}>
                {[a.line1, a.line2, [a.city, a.region].filter(Boolean).join(', '), a.postal, a.country]
                  .filter(Boolean)
                  .map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
                  ))}
              </div>
            </div>
          </>
        )}

        <div className="admin-section-title">Payment</div>
        <div className="card card--pad row-between">
          <span className="row gap-2">💳 {order.paymentMethod || 'Card'}</span>
          <span className={`status status--${cancelled ? 'cancelled' : 'delivered'}`}>{cancelled ? 'Refunded' : 'Paid'}</span>
        </div>

        {/* Merchant-only note — distinct from `notes`, the shopper's checkout note. */}
        <div className="admin-section-title">Internal note</div>
        <div className="container">
          <textarea aria-label="Internal note" className="textarea" value={noteValue} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a private note for your team…" />
          <button className="btn btn--sm btn--ghost" style={{ marginTop: 8 }} onClick={onSaveNote}>Save note</button>
        </div>
        <div style={{ height: 8 }} />
      </main>

      <div className="bottom-bar">
        <button className="btn btn--outline" onClick={() => setStatusSheet(true)}>Set status</button>
        {next ? (
          <button className="btn grow" onClick={onAdvance}>Mark {next}</button>
        ) : (
          <button className="btn grow" disabled>Completed</button>
        )}
      </div>

      {statusSheet && (
        <Sheet title="Update status" onClose={() => setStatusSheet(false)}>
          <div className="list" style={{ margin: 0 }}>
            {ALL_STATUSES.map((s) => (
              <button key={s} className="list-row" onClick={() => pickStatus(s)}>
                <span className={`status status--${s}`}>{s}</span>
                <span className="grow" />
                {cur === s && <Icon name="check" size={20} className="text-accent" />}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {trackSheet && (
        <Sheet title="Tracking" onClose={() => setTrackSheet(false)}>
          <div className="field">
            <label className="field__label" htmlFor="order-tracking">Carrier &amp; tracking number</label>
            <input id="order-tracking" className="input" value={trackDraft} onChange={(e) => setTrackDraft(e.target.value)} placeholder="e.g. DHL 1Z999AA10123456784" />
          </div>
          <button className="btn btn--block" onClick={saveTracking}>Save tracking</button>
        </Sheet>
      )}
    </>
  );
}
