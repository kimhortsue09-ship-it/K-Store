'use client';
/** Order confirmation — faithful port using order-success.css. */
import '../../styles/pages/order-success.css';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { Icon } from '@/components/Icon';

function OrderSuccessInner() {
  const id = useSearchParams().get('id') ?? '';
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id);

  return (
    <main className="screen">
      <div className="success">
        <div className="success__check"><Icon name="check" size={48} /></div>
        <h1>Thank you!</h1>
        <p className="muted">Your order has been placed successfully.</p>
        {order && (
          <div className="card card--pad success__card">
            <div className="row-between"><span className="muted">Order</span><span className="semibold">{order.number}</span></div>
            <div className="row-between"><span className="muted">Total</span><span className="semibold">{formatPrice(order.total)}</span></div>
            <div className="row-between"><span className="muted">Payment</span><span className="semibold">{order.paymentMethod || '—'}</span></div>
          </div>
        )}
        <div className="success__actions">
          {order && <Link className="btn btn--block" href={`/order/${order.id}`}>Track order</Link>}
          <Link className="btn btn--outline btn--block" href="/">Continue shopping</Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="screen" style={{ padding: 24 }}>Loading…</div>}>
      <OrderSuccessInner />
    </Suspense>
  );
}
