'use client';
/**
 * Cart — faithful port: item cards with quantity pill + remove, promo code, order summary,
 * recommended products, and a fixed total + checkout bar. Uses cart.css.
 */
import '../../styles/pages/cart.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { useStore, cartTotals } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { productArt } from '@/lib/productArt';
import { Icon } from '@/components/Icon';
import type { Promo } from '@/lib/types';

const NS = config.data.persistNamespace;

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQty, removeFromCart, clearCart, products, addToCart } = useStore();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    try {
      const r = localStorage.getItem(`${NS}:promo`);
      if (r) setPromo(JSON.parse(r) as Promo);
    } catch {
      /* ignore */
    }
  }, []);

  const count = cart.reduce((n, i) => n + i.qty, 0);
  const tot = cartTotals(cart, promo);
  const inCart = new Set(cart.map((i) => i.productId));
  const recommended = products.filter((p) => p.inStock && !inCart.has(p.id)).slice(0, 3);

  const persistPromo = (p: Promo | null) => {
    if (p) localStorage.setItem(`${NS}:promo`, JSON.stringify(p));
    else localStorage.removeItem(`${NS}:promo`);
  };
  const applyPromo = () => {
    const key = code.trim().toUpperCase();
    // Promo codes can be switched off wholesale from config — mirror dataService.applyPromo().
    const def = config.commerce.enablePromo ? config.commerce.promoCodes[key] : undefined;
    if (!def) { toast(t('cart.promo_invalid'), { kind: 'danger' }); haptic('error'); return; }
    const p: Promo = { code: key, ...def };
    setPromo(p); persistPromo(p); setCode(''); haptic('success'); toast(t('cart.promo_applied', { label: p.label }), { kind: 'success' });
  };
  const removePromo = () => { setPromo(null); persistPromo(null); };
  const clear = async () => { if (await tgConfirm(t('cart.clear_confirm'))) { clearCart(); removePromo(); } };

  return (
    <>
      <header className="cart-header">
        <div className="header-top">
          <button className="back-button" aria-label="Back" onClick={() => router.push('/')}><Icon name="back" size={24} /></button>
          <div className="header-center">
            <h1 className="page-title">{t('cart.heading')}</h1>
            <span className="cart-count">{count} {t(count === 1 ? 'unit.item' : 'unit.items')}</span>
          </div>
          {count ? <button className="clear-button" onClick={clear}>{t('cart.clear')}</button> : <span style={{ width: 44 }} />}
        </div>
      </header>

      {cart.length === 0 ? (
        <main className="screen">
          <div className="cart-content">
            <div className="empty-cart">
              <div className="empty-icon">🛒</div>
              <h3 className="empty-title">{t('cart.empty')}</h3>
              <p className="empty-description">{t('cart.empty_hint')}</p>
              <button className="continue-shopping-btn" onClick={() => router.push('/catalog')}>{t('action.continue_shopping')}</button>
            </div>
          </div>
        </main>
      ) : (
        <>
          <main className="screen">
            <div className="cart-content">
              <div className="cart-items">
                {cart.map((item) => {
                  const details = item.variant ? item.variant : item.type === 'digital' ? t('cart.instant_delivery') : t('cart.ships_in');
                  return (
                    <div key={item.id} className="cart-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="item-image" src={productArt(item)} alt={item.name} />
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <span className={`item-type-badge ${item.type}`}>{t(item.type === 'digital' ? 'cart.digital_product' : 'cart.physical_product')}</span>
                        <div className="item-details">{details}</div>
                        <div className="item-price">{formatPrice(item.price * item.qty)}</div>
                      </div>
                      <div className="item-controls">
                        <div className="quantity-controls">
                          <button className="quantity-btn" onClick={() => { updateQty(item.id, item.qty - 1); haptic('light'); }} aria-label="Decrease">−</button>
                          <span className="quantity-value">{item.qty}</span>
                          <button className="quantity-btn" onClick={() => { updateQty(item.id, item.qty + 1); haptic('light'); }} aria-label="Increase">+</button>
                        </div>
                        <button className="remove-btn" onClick={() => { removeFromCart(item.id); haptic('medium'); }}>{t('action.remove')}</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {config.features.promo && (
                <div className="promo-section">
                  {promo ? (
                    <div className="applied-promo">
                      <div className="promo-info"><span className="promo-code">{promo.code}</span><span className="promo-discount">-{formatPrice(tot.discount)}</span></div>
                      <button className="remove-promo-btn" aria-label={t('cart.remove_promo')} onClick={removePromo}>×</button>
                    </div>
                  ) : (
                    <div className="promo-input-container">
                      <input id="promo-code" aria-label={t('cart.promo_enter')} type="text" className="promo-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('cart.promo_enter')} autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') applyPromo(); }} />
                      <button className="apply-promo-btn" onClick={applyPromo}>{t('action.apply')}</button>
                    </div>
                  )}
                </div>
              )}

              <div className="order-summary">
                <h3 className="summary-title">{t('cart.order_summary')}</h3>
                <div className="summary-row"><span className="summary-label">{t('cart.subtotal')}</span><span className="summary-value">{formatPrice(tot.subtotal)}</span></div>
                <div className="summary-row"><span className="summary-label">{t('cart.shipping')}</span><span className="summary-value">{tot.shipping ? formatPrice(tot.shipping) : t('cart.free')}</span></div>
                {tot.discount > 0 && <div className="summary-row"><span className="summary-label">{t('cart.promo_discount')}</span><span className="summary-value discount">-{formatPrice(tot.discount)}</span></div>}
                <div className="summary-row"><span className="summary-label">{t('cart.tax')}</span><span className="summary-value">{formatPrice(tot.tax)}</span></div>
                <div className="summary-divider" />
                <div className="summary-row total-row"><span className="summary-label">{t('cart.total')}</span><span className="summary-value">{formatPrice(tot.total)}</span></div>
              </div>

              {recommended.length > 0 && (
                <div className="recommended-section">
                  <h3 className="section-title">{t('cart.recommended')}</h3>
                  <div className="recommended-grid">
                    {recommended.map((p) => (
                      <div key={p.id} className="recommended-item" role="button" tabIndex={0} aria-label={p.name} onClick={() => router.push(`/product/${p.id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/product/${p.id}`); } }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="recommended-image" src={productArt(p)} alt={p.name} />
                        <div className="recommended-name">{p.name}</div>
                        <div className="recommended-price">{formatPrice(p.price)}</div>
                        <button className="quick-add-btn" aria-label={t('action.add')} onClick={(e) => { e.stopPropagation(); addToCart(p); haptic('success'); toast(t('cart.item_added', { name: p.name }), { kind: 'success' }); }}>+</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>

          <div className="bottom-actions">
            <div className="total-display"><div className="total-label">{t('cart.total')}:</div><div className="total-amount">{formatPrice(tot.total)}</div></div>
            <button className="checkout-btn" onClick={() => router.push('/checkout')}>{t('cart.proceed_checkout')}</button>
          </div>
        </>
      )}
    </>
  );
}
