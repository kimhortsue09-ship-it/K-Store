'use client';
/**
 * Admin reports — faithful port of admin/reports.js: range chips (7d/30d/90d) that rescale the
 * whole report, a 4-tile KPI grid (revenue / orders / avg order / refunds), a "Revenue by day"
 * bar chart, a per-day breakdown, top products, plus a downloadable-reports section. In-memory demo.
 */
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { mergedOrders, adminStats, topProducts, SALES_SERIES } from '@/lib/admin';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

type Range = '7d' | '30d' | '90d';
const RANGES: [Range, string][] = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days']];
const MULT: Record<Range, number> = { '7d': 1, '30d': 4.3, '90d': 13 };

const REPORTS: [string, string][] = [
  ['Sales summary', 'Revenue, orders, AOV by day'],
  ['Product performance', 'Units sold + revenue per product'],
  ['Customer report', 'New vs returning, lifetime value'],
  ['Tax report', 'Collected tax by period'],
  ['Payouts statement', 'Settlements & fees'],
];

export default function AdminReportsPage() {
  const { orders: so, products } = useStore();
  const [range, setRange] = useState<Range>('7d');

  const stats = adminStats(mergedOrders(so), products);
  const mult = MULT[range];
  // Revenue derives from the sales series (not order totals) so the KPI agrees with its own chart.
  const revenue = Math.round(SALES_SERIES.reduce((a, [, v]) => a + v, 0) * mult);
  const orders = Math.round(stats.orders * mult);
  const aov = revenue / Math.max(1, orders);
  const refunds = Math.round(revenue * 0.03);
  const max = Math.max(...SALES_SERIES.map(([, v]) => v));
  const top = topProducts(products);

  const changeRange = (r: Range) => { setRange(r); haptic('selection'); };
  const dl = (name: string) => { haptic('success'); toast(`${name} exported as CSV (demo)`, { kind: 'success' }); };

  return (
    <>
      <AdminHeader title="Reports" back="/admin" actions={<button className="appbar__btn" aria-label="Export" onClick={() => dl('Report')}><Icon name="download" size={22} /></button>} />
      <main className="screen">
        <div className="tabs-pill">{RANGES.map(([id, label]) => <button key={id} className={`chip${id === range ? ' is-active' : ''}`} onClick={() => changeRange(id)}>{label}</button>)}</div>

        <div className="kpi-grid">
          <div className="kpi">
            <span className="kpi__label"><span className="kpi__icon"><Icon name="chart" size={18} /></span>Revenue</span>
            <span className="kpi__value">{formatPrice(revenue)}</span>
            <span className="kpi__delta up">▲ 9.6%</span>
          </div>
          <div className="kpi">
            <span className="kpi__label"><span className="kpi__icon"><Icon name="bag" size={18} /></span>Orders</span>
            <span className="kpi__value">{orders}</span>
            <span className="kpi__delta up">▲ 6.2%</span>
          </div>
          <div className="kpi">
            <span className="kpi__label"><span className="kpi__icon"><Icon name="tag" size={18} /></span>Avg order</span>
            <span className="kpi__value">{formatPrice(aov)}</span>
          </div>
          <div className="kpi">
            <span className="kpi__label"><span className="kpi__icon"><Icon name="trash" size={18} /></span>Refunds</span>
            <span className="kpi__value">{formatPrice(refunds)}</span>
            <span className="kpi__delta down">▼ 1.1%</span>
          </div>
        </div>

        <div className="chart-card">
          <div className="row-between"><strong>Revenue by day</strong><span className="text-accent semibold">{formatPrice(revenue)}</span></div>
          <div className="bars">
            {SALES_SERIES.map(([label, val]) => (
              <div key={label} className="bar">
                <div className="bar__fill" style={{ height: `${Math.round((val / max) * 100)}%` }} />
                <span className="bar__label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section-title">Breakdown</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {SALES_SERIES.map(([label, val]) => (
            <div key={label} className="data-row">
              <span className="data-row__main">
                <span className="data-row__title">{label}</span>
                <span className="data-row__sub">{Math.round((val / aov) * mult)} orders</span>
              </span>
              <span className="semibold">{formatPrice(Math.round(val * mult))}</span>
            </div>
          ))}
        </div>

        <div className="admin-section-title">Top products</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {top.map(({ product, sold }, i) => (
            <div key={product.id} className="data-row">
              <span className="data-row__avatar" style={{ fontWeight: 700 }}>{i + 1}</span>
              <span className="data-row__main">
                <span className="data-row__title">{product.name}</span>
                <span className="data-row__sub">{sold} sold</span>
              </span>
              <span className="semibold">{formatPrice(product.price * sold)}</span>
            </div>
          ))}
        </div>

        <div className="admin-section-title">Download reports</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {REPORTS.map(([name, desc]) => (
            <button key={name} className="data-row" onClick={() => dl(name)}>
              <span className="data-row__avatar"><Icon name="chart" size={18} /></span>
              <span className="data-row__main"><span className="data-row__title">{name}</span><span className="data-row__sub">{desc}</span></span>
              <span className="data-row__end"><Icon name="download" size={18} className="text-accent" /></span>
            </button>
          ))}
        </div>
      </main>
      <AdminTabBar active="analytics" />
    </>
  );
}
