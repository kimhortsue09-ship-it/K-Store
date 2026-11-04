'use client';
/**
 * Order detail / tracking — faithful port: status card, Details / Tracking / Receipt tabs,
 * timeline, receipt and reorder/track actions. Uses order-view.css.
 */
import '../../../styles/pages/order-view.css';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatPrice, formatDate, formatDateWeekday } from '@/lib/format';
import { t } from '@/lib/i18n';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { productArt } from '@/lib/productArt';
import { Icon } from '@/components/Icon';
import type { CartItem, Product } from '@/lib/types';

const FLOW = ['pending', 'paid', 'shipped', 'delivered'];
const STATUS_META: Record<string, { icon: string; textKey: string; descKey: string }> = {
  pending: { icon: '⏳', textKey: 'order.pending_text', descKey: 'order.pending_desc' },
  paid: { icon: '📦', textKey: 'order.paid_text', descKey: 'order.paid_desc' },
  shipped: { icon: '🚚', textKey: 'order.shipped_text', descKey: 'order.shipped_desc' },
  delivered: { icon: '✅', textKey: 'order.delivered_text', descKey: 'order.delivered_desc' },
  cancelled: { icon: '❌', textKey: 'order.cancelled_text', descKey: 'order.cancelled_desc' },
};
const TIMELINE = [
  { status: 'pending', titleKey: 'order.tl_placed_title', descKey: 'order.tl_placed_desc' },
  { status: 'paid', titleKey: 'order.tl_confirmed_title', descKey: 'order.tl_confirmed_desc' },
  { status: 'shipped', titleKey: 'order.tl_shipped_title', descKey: 'order.tl_shipped_desc' },
  { status: 'delivered', titleKey: 'order.tl_delivered_title', descKey: 'order.tl_delivered_desc' },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { orders, addToCart } = useStore();
  const order = orders.find((o) => o.id === id);
  const [tab, setTab] = useState<'details' | 'tracking' | 'receipt'>('details');
  const screenRef = useRef<HTMLElement>(null);

  const share = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ text }).catch(() => {});
    else toast('Sharing not available');
  };

  if (!order) {
    return (
      <>
        <header className="order-view-header"><div className="header-top">
          <button className="back-button" aria-label="Back" onClick={() => router.push('/orders')}><Icon name="back" size={24} /></button>
          <div className="header-center"><h1 className="page-title">{t('order.details_title')}</h1><span className="order-id">{t('order.word')}</span></div>
          <button className="share-button" aria-label={t('product.share')} onClick={() => share('My order')}><Icon name="send" size={22} /></button>
        </div></header>
        <main className="screen"><div className="order-content"><div className="empty-state">
          <div className="empty-state__emoji">❌</div><h3>{t('order.not_found')}</h3>
          <p>{t('order.not_found_desc')}</p>
          <Link className="btn" href="/orders">{t('orders.title')}</Link>
        </div></div></main>
      </>
    );
  }

  const meta = STATUS_META[order.status] ?? STATUS_META.paid;
  const reached = FLOW.indexOf(order.status);
  const a = order.address;
  const itemImg = (it: CartItem) => productArt(it);
  const est = () => formatDateWeekday(new Date(new Date(order.createdAt).getTime() + 5 * 86400000).toISOString());
  const reorder = () => {
    order.items.forEach((it) => addToCart({ id: it.productId, name: it.name, price: it.price, type: it.type, emoji: it.emoji, image: itemImg(it) } as unknown as Product, it.qty));
    haptic('success');
    toast('Items added to cart', { kind: 'success' });
    setTimeout(() => router.push('/cart'), 600);
  };
  /** line1 / line2 / "city, region" / postal / country — each on its own line. */
  const addressLines = a
    ? [a.line1, a.line2, [a.city, a.region].filter(Boolean).join(', '), a.postal, a.country].filter(Boolean)
    : [];
  const receiptRows: [string, number][] = [
    [t('cart.subtotal'), order.subtotal],
    ...(order.discount ? ([[t('cart.discount'), -order.discount]] as [string, number][]) : []),
    [t('cart.shipping'), order.shipping],
    [t('cart.tax'), order.tax],
  ];

  return (
    <>
      <header className="order-view-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/orders')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('order.details_title')}</h1><span className="order-id">{order.number}</span></div>
        <button className="share-button" aria-label={t('product.share')} onClick={() => share(`My order ${order.number} — ${formatPrice(order.total)}`)}><Icon name="send" size={22} /></button>
      </div></header>

      <main className="screen" ref={screenRef}>
        <div className="order-content">
          <div className="status-card">
            <div className="status-icon">{meta.icon}</div>
            <div className="status-info">
              <div className="status-text">{t(meta.textKey)}</div>
              <div className="status-description">{t(meta.descKey)}</div>
              {(order.status === 'shipped' || order.status === 'paid') && <div className="estimated-delivery">{t('order.expected')}: {est()}</div>}
            </div>
          </div>

          <div className="tab-navigation">
            {(['details', 'tracking', 'receipt'] as const).map((k) => (
              <button key={k} className={`tab-button ${tab === k ? 'active' : ''}`} onClick={() => { setTab(k); haptic('selection'); }}>
                {t('order.tab_' + k)}
              </button>
            ))}
          </div>

          <div className="tab-content">
            <div className={`tab-panel ${tab === 'details' ? 'active' : ''}`}>
              <div className="section"><h3 className="section-title">{t('order.items_ordered')}</h3>
                <div className="order-items">
                  {order.items.map((it) => (
                    <div key={it.id} className="order-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="item-image" src={itemImg(it)} alt={it.name} />
                      <div className="item-details"><div className="item-name">{it.name}</div><div className="item-quantity">{t('order.qty', { count: it.qty })}</div></div>
                      <div className="item-price">{formatPrice(it.price * it.qty)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section"><h3 className="section-title">{t('checkout.shipping_info')}</h3>
                <div className="info-card">
                  <div className="info-row"><span className="info-label">{t('order.name')}</span><span className="info-value">{a?.name || t('order.guest')}</span></div>
                  <div className="info-row"><span className="info-label">{t('order.phone')}</span><span className="info-value">{a?.phone || '—'}</span></div>
                  <div className="info-row"><span className="info-label">{t('order.address')}</span><span className="info-value">
                    {addressLines.length
                      ? addressLines.map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)
                      : '—'}
                  </span></div>
                  <div className="info-row"><span className="info-label">{t('order.delivery')}</span><span className="info-value">{order.shippingMethod || t('order.standard')}</span></div>
                </div>
              </div>
              <div className="section"><h3 className="section-title">{t('checkout.payment_method')}</h3>
                <div className="payment-card"><div className="payment-icon">💳</div>
                  <div className="payment-info"><div className="payment-method">{order.paymentMethod || 'Card'}</div><div className="payment-status">{order.status === 'cancelled' ? t('order.refunded') : t('order.status.paid')}</div></div>
                </div>
              </div>
            </div>

            <div className={`tab-panel ${tab === 'tracking' ? 'active' : ''}`}>
              <div className="tracking-timeline">
                {TIMELINE.map((step) => {
                  const idx = FLOW.indexOf(step.status);
                  const cls = idx < reached ? 'completed' : idx === reached ? 'current' : '';
                  return (
                    <div key={step.status} className={`timeline-item ${cls}`}>
                      <div className="timeline-dot">{idx < reached ? '✓' : idx + 1}</div>
                      <div className="timeline-content">
                        <div className="timeline-title">{t(step.titleKey)}</div>
                        <div className="timeline-description">{t(step.descKey)}</div>
                        <div className="timeline-time">{idx <= reached ? formatDate(order.createdAt) : t('order.status.pending')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`tab-panel ${tab === 'receipt' ? 'active' : ''}`}>
              <div className="receipt-container">
                <div className="receipt-header"><div className="receipt-title">{t('order.receipt_title')}</div><div className="receipt-date">{formatDate(order.createdAt)}</div></div>
                <div className="receipt-items">
                  {order.items.map((it) => (
                    <div key={it.id} className="receipt-item">
                      <span className="receipt-item-name">{it.name}</span>
                      <span className="receipt-item-qty">×{it.qty}</span>
                      <span className="receipt-item-price">{formatPrice(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="receipt-summary">
                  {receiptRows.map(([label, val]) => (
                    <div key={label} className="summary-row"><span className="summary-label">{label}</span><span className="summary-value">{val < 0 ? '-' : ''}{formatPrice(Math.abs(val))}</span></div>
                  ))}
                  <div className="summary-row total"><span className="summary-label">{t('cart.total')}</span><span className="summary-value">{formatPrice(order.total)}</span></div>
                </div>
                <div className="receipt-footer"><button className="download-receipt-btn" onClick={() => toast('Receipt downloaded (demo)', { kind: 'success' })}><Icon name="box" size={16} /> {t('order.download_receipt')}</button></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="bottom-actions">
        <button className="action-btn secondary" onClick={reorder}>{t('order.reorder')}</button>
        <button className="action-btn primary" onClick={() => { setTab('tracking'); haptic('selection'); screenRef.current?.scrollIntoView?.({ behavior: 'smooth' }); }}>{t('order.track_package')}</button>
      </div>
    </>
  );
}
