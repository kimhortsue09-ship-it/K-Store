'use client';
/**
 * Admin analytics — faithful port of admin/analytics.js: revenue KPI grid (with deltas),
 * a weekly sales bar chart, and a best-sellers list. Uses admin.css.
 */
import { useStore } from '@/lib/store';
import { mergedOrders, adminStats, SALES_SERIES, topProducts } from '@/lib/admin';
import { formatPrice } from '@/lib/format';
import { productArt } from '@/lib/productArt';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

export default function AdminAnalyticsPage() {
  const { orders: storeOrders, products } = useStore();
  const orders = mergedOrders(storeOrders);
  const stats = adminStats(orders);
  const top = topProducts(products);
  const max = Math.max(...SALES_SERIES.map((s) => s[1]));
  const weekTotal = SALES_SERIES.reduce((a, [, v]) => a + v, 0);

  const kpis: { label: string; icon: string; value: string; delta?: string; dir?: 'up' | 'down' }[] = [
    { label: 'Revenue (7d)', icon: 'chart', value: formatPrice(weekTotal), delta: '12.4%', dir: 'up' },
    { label: 'Orders', icon: 'bag', value: String(stats.orders), delta: '8.1%', dir: 'up' },
    { label: 'Avg order', icon: 'users', value: formatPrice(stats.revenue / Math.max(1, stats.orders)) },
    { label: 'Conversion', icon: 'tag', value: '3.8%', delta: '0.4%', dir: 'down' },
  ];

  return (
    <>
      <AdminHeader title="Analytics" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className="kpi">
              <span className="kpi__label"><span className="kpi__icon"><Icon name={k.icon} size={18} /></span>{k.label}</span>
              <span className="kpi__value">{k.value}</span>
              {k.delta && <span className={`kpi__delta ${k.dir}`}>{k.dir === 'up' ? '▲' : '▼'} {k.delta}</span>}
            </div>
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

        <div className="admin-section-title">Top Selling Products</div>
        <div className="list" style={{ marginTop: 0 }}>
          {top.map(({ product, sold }, i) => (
            <div key={product.id} className="data-row">
              <span className="data-row__avatar" style={{ fontWeight: 700 }}>{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="data-row__avatar" src={productArt(product)} alt="" width={40} height={40} />
              <span className="data-row__main">
                <span className="data-row__title">{product.name}</span>
                <span className="data-row__sub">{sold} sold</span>
              </span>
              <span className="semibold">{formatPrice(product.price * sold)}</span>
            </div>
          ))}
        </div>
      </main>
      <AdminTabBar active="analytics" />
    </>
  );
}
