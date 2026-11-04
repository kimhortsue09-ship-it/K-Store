'use client';
/**
 * Track Order (guest lookup by order number) — faithful port of the HTML
 * `track-order.html` + `assets/js/pages/track-order.js`.
 * Enter an order number to see its status + tracking timeline, without signing in.
 * Looks up local orders; wire to your API for real guest tracking. Uses order-view.css.
 */
import '../../styles/pages/order-view.css';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatPrice, formatDate } from '@/lib/format';
import { toast } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import type { Order } from '@/lib/types';

const FLOW: Order['status'][] = ['pending', 'paid', 'shipped', 'delivered'];
const STATUS: Record<Order['status'], { icon: string; text: string }> = {
  pending: { icon: '⏳', text: 'Pending' },
  paid: { icon: '📦', text: 'Confirmed' },
  shipped: { icon: '🚚', text: 'On the way' },
  delivered: { icon: '✅', text: 'Delivered' },
  cancelled: { icon: '❌', text: 'Cancelled' },
};
const STEPS = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'];

function Timeline({ status }: { status: Order['status'] }) {
  const reached = FLOW.indexOf(status);
  return (
    <div className="tracking-timeline" style={{ marginTop: 16 }}>
      {STEPS.map((label, i) => {
        const cls = i < reached ? 'completed' : i === reached ? 'current' : '';
        return (
          <div key={label} className={`timeline-item ${cls}`}>
            <div className="timeline-dot">{i < reached ? '✓' : i + 1}</div>
            <div className="timeline-content">
              <div className="timeline-title">{label}</div>
              <div className="timeline-description">{i <= reached ? 'Completed' : 'Pending'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackOrderPage() {
  const router = useRouter();
  const { orders } = useStore();
  const [num, setNum] = useState('');
  const [result, setResult] = useState<{ searched: boolean; order: Order | null }>({ searched: false, order: null });

  const track = () => {
    const q = num.trim().toUpperCase();
    if (!q) { toast('Enter an order number', { kind: 'danger' }); return; }
    const order = orders.find((o) => (o.number || o.id).toUpperCase() === q) ?? null;
    haptic(order ? 'success' : 'error');
    setResult({ searched: true, order });
  };

  const found = result.order;
  // Cancelled orders have no place on the fulfilment flow — render them against the "paid" step.
  const step: Order['status'] | null = found ? (found.status === 'cancelled' ? 'paid' : found.status) : null;

  return (
    <>
      <header className="order-view-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">Track Order</h1></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen screen--no-tabbar">
        <div className="container" style={{ paddingTop: 24 }}>
          <div className="track-hero">
            <div className="track-hero__icon">🔎</div>
            <h2>Track your order</h2>
            <p className="muted">Enter your order number (e.g. NV-1001) to see live status.</p>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label className="field__label" htmlFor="num">Order number</label>
            <input
              className="input"
              id="num"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') track(); }}
              placeholder="NV-1001"
              autoComplete="off"
            />
          </div>
          <button className="btn btn--block" onClick={track}><Icon name="search" size={18} /> Track</button>

          <div id="result">
            {result.searched && !found && (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state__emoji">🧐</div>
                <h3>Order not found</h3>
                <p>Check the number and try again.</p>
              </div>
            )}
            {found && step && (
              <>
                <div className="status-card" style={{ marginTop: 20 }}>
                  <div className="status-icon">{STATUS[found.status].icon}</div>
                  <div className="status-info">
                    <div className="status-text">{STATUS[found.status].text}</div>
                    <div className="status-description">{found.number} · placed {formatDate(found.createdAt)}</div>
                    <div className="estimated-delivery">{(found.items || []).length} item(s) · {formatPrice(found.total)}</div>
                  </div>
                </div>
                <Timeline status={step} />
                <Link className="btn btn--outline btn--block" style={{ marginTop: 16 }} href={`/order/${encodeURIComponent(found.id)}`}>View full details</Link>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
