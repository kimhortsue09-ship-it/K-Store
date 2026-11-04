'use client';
/**
 * Admin orders — faithful port of admin/orders.js: status filter chips (seeded from `?status=`
 * so the dashboard's pending alert deep-links here), order rows (number + customer · date) and
 * an empty state when a filter has no orders. Uses admin.css.
 */
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { mergedOrders } from '@/lib/admin';
import { formatPrice, formatDate } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const FILTERS = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;
type Filter = (typeof FILTERS)[number];

function isFilter(v: string | null): v is Filter {
  return !!v && (FILTERS as readonly string[]).includes(v);
}

function AdminOrdersInner() {
  const { orders: storeOrders } = useStore();
  const orders = mergedOrders(storeOrders);
  const param = useSearchParams().get('status');
  // The active filter is seeded from the query string (orders.js:15), then owned by the chips.
  const [filter, setFilter] = useState<Filter>(() => (isFilter(param) ? param : 'all'));
  const list = orders.filter((o) => filter === 'all' || o.status === filter);

  return (
    <>
      <AdminHeader title="Orders" back="/admin" />
      <main className="screen">
        <div className="tabs-pill">
          {FILTERS.map((f) => (
            <button key={f} className={`chip${filter === f ? ' is-active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
        {list.length ? (
          <div className="list" style={{ margin: 0, padding: '0 16px 16px' }}>
            {list.map((o) => (
              <Link key={o.id} href={`/admin/order/${o.id}`} className="data-row">
                <span className="data-row__avatar"><Icon name="bag" size={18} /></span>
                <span className="data-row__main">
                  <span className="data-row__title">{o.number}</span>
                  <span className="data-row__sub">{o.address?.name || 'Guest'} · {formatDate(o.createdAt)}</span>
                </span>
                <span className="data-row__end">
                  <span className="semibold">{formatPrice(o.total)}</span>
                  <span className={`status status--${o.status}`}>{o.status}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state__emoji">📦</div><h3>No {filter} orders</h3></div>
        )}
      </main>
      <AdminTabBar active="orders" />
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="screen" style={{ padding: 24 }}>Loading…</div>}>
      <AdminOrdersInner />
    </Suspense>
  );
}
