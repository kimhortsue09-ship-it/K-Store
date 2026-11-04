'use client';
/**
 * Admin dashboard — faithful port of admin/dashboard.js: KPI grid (with deltas + go-chevron),
 * Quick actions, a 7-day sales bar chart, a pending-orders alert, and recent orders. Uses admin.css.
 */
import Link from 'next/link';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { formatPrice, formatDate } from '@/lib/format';
import { mergedOrders, adminStats, SALES_SERIES } from '@/lib/admin';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

export default function AdminDashboard() {
  const { orders: storeOrders, products } = useStore();
  const orders = mergedOrders(storeOrders);
  const stats = adminStats(orders, products);
  const pending = stats.pending;
  const recent = orders.slice(0, 5);
  const max = Math.max(...SALES_SERIES.map((s) => s[1]));
  const weekTotal = SALES_SERIES.reduce((a, [, v]) => a + v, 0);

  const kpis: { label: string; icon: string; value: string; delta?: string; dir?: 'up' | 'down'; href: string }[] = [
    { label: 'Revenue', icon: 'chart', value: formatPrice(stats.revenue), delta: '12.4%', dir: 'up', href: '/admin/reports' },
    { label: 'Orders', icon: 'bag', value: String(stats.orders), delta: '8.1%', dir: 'up', href: '/admin/orders' },
    { label: 'Products', icon: 'box', value: String(stats.products), href: '/admin/products' },
    { label: 'Customers', icon: 'users', value: String(stats.customers), delta: '3.2%', dir: 'up', href: '/admin/customers' },
  ];
  const quick = [
    { label: 'Add product', icon: 'plus', href: '/admin/product-edit' },
    { label: 'Orders', icon: 'bag', href: '/admin/orders' },
    { label: 'Analytics', icon: 'chart', href: '/admin/analytics' },
    { label: 'Promos', icon: 'tag', href: '/admin/marketing' },
  ];

  return (
    <>
      <AdminHeader title={`${config.brand.name} Admin`} />
      <main className="screen">
        <div className="kpi-grid">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="kpi kpi--link">
              <span className="kpi__label"><span className="kpi__icon"><Icon name={k.icon} size={18} /></span>{k.label}<Icon name="chevron" size={14} className="kpi__go" /></span>
              <span className="kpi__value">{k.value}</span>
              {k.delta && <span className={`kpi__delta ${k.dir}`}>{k.dir === 'up' ? '▲' : '▼'} {k.delta}</span>}
            </Link>
          ))}
        </div>

        <div className="admin-section-title">Quick actions</div>
        <div className="quick-actions">
          {quick.map((q) => (
            <Link key={q.label} href={q.href} className="quick-action">
              <span className="quick-action__icon"><Icon name={q.icon} size={22} /></span>{q.label}
            </Link>
          ))}
        </div>

        <div className="chart-card">
          <div className="row-between"><strong>Sales this week</strong><span className="text-accent semibold">{formatPrice(weekTotal)}</span></div>
          <div className="bars">
            {SALES_SERIES.map(([label, val]) => (
              <div key={label} className="bar"><div className="bar__fill" style={{ height: `${Math.round((val / max) * 100)}%` }} /><span className="bar__label">{label}</span></div>
            ))}
          </div>
        </div>

        {pending > 0 && (
          <Link href="/admin/orders?status=pending" className="card card--pad row-between" style={{ color: 'var(--text)' }}>
            <span className="row gap-2"><Icon name="bell" size={18} /> {pending} orders awaiting action</span>
            <Icon name="chevron" size={18} />
          </Link>
        )}

        <div className="section-head"><h2>Recent orders</h2><Link className="section-head__link" href="/admin/orders">See all</Link></div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {recent.map((o) => (
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
      </main>
      <AdminTabBar active="dashboard" />
    </>
  );
}
