'use client';
/**
 * Orders — faithful port of the order-history page: stats grid, status filter tabs, and rich
 * order cards with an item preview. Uses orders.css.
 */
import '../../styles/pages/orders.css';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatPrice, formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import { TabBar } from '@/components/TabBar';
import { productArt } from '@/lib/productArt';

const TABS: [string, string][] = [['all', 'orders.tab_all'], ['active', 'orders.tab_active'], ['delivered', 'order.status.delivered'], ['cancelled', 'order.status.cancelled']];
const ACTIVE = ['pending', 'paid', 'shipped'];

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useStore();
  const [filter, setFilter] = useState('all');
  const list = orders.filter((o) => (filter === 'all' ? true : filter === 'active' ? ACTIVE.includes(o.status) : o.status === filter));

  const completed = orders.filter((o) => o.status === 'delivered').length;
  const transit = orders.filter((o) => o.status === 'shipped').length;
  const processing = orders.filter((o) => o.status === 'pending' || o.status === 'paid').length;
  const spent = orders.reduce((s, o) => s + o.total, 0);
  const statCards: [string, string, string | number, string][] = [
    ['completed', '📦', completed, t('orders.stat_completed')],
    ['processing', '🚚', transit, t('orders.stat_in_transit')],
    ['pending', '⏳', processing, t('orders.stat_processing')],
    ['total', '💰', formatPrice(spent), t('orders.stat_total_spent')],
  ];

  return (
    <>
      <header className="orders-header">
        <div className="header-top">
          <button className="back-button" aria-label="Back" onClick={() => router.push('/')}><Icon name="back" size={24} /></button>
          <div className="header-center">
            <h1 className="page-title">{t('orders.title')}</h1>
            <span className="order-count">{t('orders.count', { count: orders.length })}</span>
          </div>
          <span className="filter-button" style={{ visibility: 'hidden' }}><Icon name="filter" size={24} /></span>
        </div>
      </header>

      <main className="screen">
        <div className="orders-content">
          <div className="stats-grid">
            {statCards.map(([cls, ic, num, label]) => (
              <div key={label} className="stat-card">
                <span className={`stat-icon ${cls}`}>{ic}</span>
                <span className="stat-info"><span className="stat-number">{num}</span><span className="stat-label">{label}</span></span>
              </div>
            ))}
          </div>

          <div className="filter-tabs">
            {TABS.map(([id, label]) => (
              <button key={id} className={`filter-tab${id === filter ? ' active' : ''}`} onClick={() => setFilter(id)}>{t(label)}</button>
            ))}
          </div>

          {list.length ? (
            <div className="orders-list">
              {list.map((o) => {
                const items = o.items || [];
                const preview = items.slice(0, 3);
                const remaining = Math.max(0, items.length - 3);
                return (
                  <div key={o.id} className="order-item" role="button" tabIndex={0} aria-label={o.number} onClick={() => router.push(`/order/${o.id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/order/${o.id}`); } }}>
                    <div className="order-header">
                      <div className="order-info"><div className="order-id">{o.number}</div><div className="order-date">{formatDate(o.createdAt)}</div></div>
                      <div className={`order-status ${o.status}`}>{t('order.status.' + o.status)}</div>
                    </div>
                    <div className="order-items-preview">
                      <div className="item-images">
                        {preview.map((it, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={idx} className="item-image" src={productArt(it)} alt={it.name} />
                        ))}
                        {remaining ? <span className="item-image more">+{remaining}</span> : null}
                      </div>
                      <div className="items-summary">
                        <div className="items-count">{items.length} {t(items.length === 1 ? 'unit.item' : 'unit.items')}</div>
                        <div className="items-preview">{items.map((i) => i.name).join(', ')}</div>
                      </div>
                    </div>
                    <div className="order-footer">
                      <div className="order-total">{formatPrice(o.total)}</div>
                      <div className="order-actions"><span className="btn btn--ghost btn--sm">{t('orders.view')} <Icon name="chevron" size={16} /></span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-orders">
              <div className="empty-icon">📦</div>
              <h3 className="empty-title">{t('orders.empty_found')}</h3>
              <p>{t('orders.empty_hint')}</p>
              <Link className="btn" href="/catalog" style={{ marginTop: 12 }}>{t('nav.catalog')}</Link>
            </div>
          )}
        </div>
      </main>

      <TabBar />
    </>
  );
}
