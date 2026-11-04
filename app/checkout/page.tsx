'use client';
/**
 * Checkout — faithful port: order summary, shipping form, delivery options, payment methods
 * (Stars / TON / Stripe / COD via the payments adapter), notes and a terms gate, plus the
 * processing / success modals. Uses checkout.css.
 */
import '../../styles/pages/checkout.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { useStore, cartTotals } from '@/lib/store';
import { formatPrice, formatNumber } from '@/lib/format';
import { t } from '@/lib/i18n';
import { enabledMethods, methodById, pay, toStars, toTon } from '@/lib/payments';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Address, Order, PaymentMethod, PaymentResult, Promo } from '@/lib/types';

const NS = config.data.persistNamespace;
const DELIVERY: Record<string, { labelKey: string; descKey: string; price: number }> = {
  standard: { labelKey: 'checkout.delivery_standard', descKey: 'checkout.delivery_standard_desc', price: 9.99 },
  express: { labelKey: 'checkout.delivery_express', descKey: 'checkout.delivery_express_desc', price: 19.99 },
  overnight: { labelKey: 'checkout.delivery_overnight', descKey: 'checkout.delivery_overnight_desc', price: 39.99 },
};
const COUNTRIES: [string, string][] = [['', 'Select country'], ['US', 'United States'], ['CA', 'Canada'], ['UK', 'United Kingdom'], ['DE', 'Germany'], ['FR', 'France'], ['AU', 'Australia'], ['JP', 'Japan'], ['NG', 'Nigeria'], ['OTHER', 'Other']];

/** The order as it exists before a rail confirms it — what `pay()` stashes for the redirect flow. */
type OrderDraft = Omit<Order, 'id' | 'number' | 'createdAt' | 'status'>;

export default function CheckoutPage() {
  const router = useRouter();
  const { ready, cart, placeOrder, clearCart, addresses, saveAddress } = useStore();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [delivery, setDelivery] = useState('standard');
  const [country, setCountry] = useState('');
  const [payment, setPayment] = useState(() => enabledMethods()[0]?.id || 'cod');
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', city: '', postal: '', notes: '' });
  const [agree, setAgree] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<{ order: Order; result: PaymentResult } | null>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    try {
      const r = localStorage.getItem(`${NS}:promo`);
      if (r) setPromo(JSON.parse(r) as Promo);
    } catch { /* ignore */ }
  }, []);

  // The store hydrates addresses after mount, so prefill from the default address once it's `ready`
  // (the HTML edition reads it synchronously — checkout.js:22 / 91-103).
  useEffect(() => {
    if (!ready || prefilled.current) return;
    prefilled.current = true;
    const d = addresses.find((a) => a.default);
    if (!d) return;
    setForm((f) => ({ ...f, fullName: d.name || '', phone: d.phone || '', address: d.line1 || '', city: d.city || '', postal: d.postal || '' }));
    if (d.country) setCountry(d.country);
  }, [ready, addresses]);

  // Don't bounce to the cart before hydration, nor after we cleared it on a successful order.
  useEffect(() => {
    if (ready && !success && cart.length === 0) router.replace('/cart');
  }, [ready, success, cart.length, router]);

  const tot = cartTotals(cart, promo, DELIVERY[delivery].price);
  const methods = useMemo(() => enabledMethods(country), [country]);
  useEffect(() => { if (!methods.some((m) => m.id === payment)) setPayment(methods[0]?.id || ''); }, [methods, payment]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /** Small conversion hint shown under a method (checkout.js:42-46) — always that method's own note. */
  const payHint = (m: PaymentMethod): string => {
    if (m.provider === 'telegramStars') return `≈ ${formatNumber(toStars(tot.total))} ⭐`;
    if (m.provider === 'tonConnect') return `≈ ${toTon(tot.total)} TON`;
    return m.note || '';
  };

  const placeOrderNow = async () => {
    const v = (s: string) => s.trim();
    if (!v(form.fullName) || !v(form.phone) || !v(form.address) || !v(form.city)) {
      toast(t('checkout.err_shipping'), { kind: 'danger' }); haptic('error'); return;
    }
    const method = methodById(payment);
    if (!method) { toast(t('checkout.err_method'), { kind: 'danger' }); haptic('error'); return; }

    const defaultAddr = addresses.find((a) => a.default);
    const address: Address = {
      id: defaultAddr?.id || `addr-${Date.now().toString(36)}`,
      label: defaultAddr?.label || 'Home',
      name: v(form.fullName), phone: v(form.phone), line1: v(form.address),
      city: v(form.city), postal: v(form.postal), country, default: true,
    };
    saveAddress(address);

    const draft: OrderDraft = {
      items: cart, subtotal: tot.subtotal, discount: tot.discount, shipping: tot.shipping, tax: tot.tax, total: tot.total,
      address, paymentMethod: method.label, paymentProvider: method.provider, promo,
      shippingMethod: delivery[0].toUpperCase() + delivery.slice(1), notes: v(form.notes),
    };

    setProcessing(true);
    try {
      // `pay()` stashes the draft under `:pendingOrder` so a gateway redirect can finalise on return.
      const result = await pay({ method, amount: tot.total, description: `Order at ${config.brand.name}`, order: draft as Order });
      if (result.status === 'redirect') return; // navigated to the gateway; the return page finalises
      if (result.status === 'failed') {
        setProcessing(false);
        toast(result.error ? `${t('checkout.pay_failed')} ${result.error}` : t('checkout.pay_failed'), { kind: 'danger' });
        haptic('error');
        return;
      }
      const order = placeOrder({
        ...draft,
        paymentStatus: result.status,
        paymentReference: result.reference ?? null,
        status: result.status === 'pending' ? 'pending' : 'paid',
      });
      clearCart();
      localStorage.removeItem(`${NS}:promo`);
      localStorage.removeItem(`${NS}:pendingOrder`);
      haptic('success');
      setProcessing(false);
      setSuccess({ order, result });
    } catch (err) {
      setProcessing(false);
      toast(`Payment error: ${err instanceof Error ? err.message : String(err)}`, { kind: 'danger' });
      haptic('error');
    }
  };

  const pending = success?.result.status === 'pending';

  return (
    <>
      <header className="checkout-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/cart')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('checkout.title')}</h1><span className="step-indicator">{t('checkout.step')}</span></div>
        <div className="header-spacer" />
      </div></header>

      <main className="screen"><div className="checkout-content">
        <div className="order-summary-section"><h3 className="section-title">{t('cart.order_summary')}</h3>
          <div className="order-items">{cart.map((it) => <div key={it.id} className="co-item"><span className="co-item__name">{it.name}</span><span className="co-item__qty">×{it.qty}</span><span className="co-item__price">{formatPrice(it.price * it.qty)}</span></div>)}</div>
          <div className="order-total"><div className="total-row"><span className="total-label">{t('cart.total')}</span><span className="total-amount">{formatPrice(tot.total)}</span></div></div>
        </div>

        <div className="shipping-section"><h3 className="section-title">{t('checkout.shipping_info')}</h3>
          <div className="form-group"><label className="form-label" htmlFor="co-name">{t('checkout.full_name')}</label><input id="co-name" type="text" className="form-input" value={form.fullName} onChange={set('fullName')} placeholder={t('checkout.full_name_ph')} /></div>
          <div className="form-group"><label className="form-label" htmlFor="co-phone">{t('checkout.phone')}</label><input id="co-phone" type="tel" className="form-input" value={form.phone} onChange={set('phone')} placeholder={t('checkout.phone_ph')} /></div>
          <div className="form-group"><label className="form-label" htmlFor="co-address">{t('checkout.address')}</label><input id="co-address" type="text" className="form-input" value={form.address} onChange={set('address')} placeholder={t('checkout.address_ph')} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label" htmlFor="co-city">{t('checkout.city')}</label><input id="co-city" type="text" className="form-input" value={form.city} onChange={set('city')} placeholder={t('checkout.city')} /></div>
            <div className="form-group"><label className="form-label" htmlFor="co-postal">{t('checkout.postal')}</label><input id="co-postal" type="text" className="form-input" value={form.postal} onChange={set('postal')} placeholder={t('checkout.postal_ph')} /></div>
          </div>
          <div className="form-group"><label className="form-label" htmlFor="co-country">{t('checkout.country')}</label>
            <select id="co-country" className="form-select" value={country} onChange={(e) => setCountry(e.target.value)}>{COUNTRIES.map(([v, l]) => <option key={v} value={v}>{v === '' ? t('checkout.select_country') : l}</option>)}</select></div>
        </div>

        <div className="delivery-section"><h3 className="section-title">{t('checkout.delivery_options')}</h3>
          <div className="delivery-options">
            {Object.entries(DELIVERY).map(([id, d]) => (
              <label key={id} className="delivery-option">
                <input type="radio" name="delivery" value={id} checked={delivery === id} onChange={() => { setDelivery(id); haptic('selection'); }} />
                <div className="option-content"><div className="option-info"><div className="option-name">{t(d.labelKey)}</div><div className="option-description">{t(d.descKey)}</div></div><div className="option-price">{formatPrice(d.price)}</div></div>
              </label>
            ))}
          </div>
        </div>

        <div className="payment-section" id="paymentSection"><h3 className="section-title">{t('checkout.payment_method')}</h3>
          <div className="payment-options">
            {methods.length === 0
              ? <p className="muted text-sm">{t('checkout.no_methods')}</p>
              : methods.map((m) => (
                <label key={m.id} className="payment-option">
                  <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => { setPayment(m.id); haptic('selection'); }} />
                  <div className="option-content"><div className="payment-icon">{m.icon}</div><div className="option-info"><div className="option-name">{m.label}</div><div className="option-description">{payHint(m)}</div></div></div>
                </label>
              ))}
          </div>
        </div>

        <div className="notes-section"><h3 className="section-title">{t('checkout.order_notes')}</h3>
          <textarea id="co-notes" aria-label={t('checkout.order_notes')} className="form-textarea" value={form.notes} onChange={set('notes')} placeholder={t('checkout.notes_ph')} /></div>

        <div className="terms-section"><label className="checkbox-container">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span className="checkmark" />
          <span className="checkbox-text">{t('checkout.agree_pre')}<Link href="/legal?doc=terms" className="terms-link">{t('checkout.terms')}</Link>{t('checkout.agree_mid')}<Link href="/legal?doc=privacy" className="terms-link">{t('checkout.privacy')}</Link></span>
        </label></div>
      </div></main>

      <div className="bottom-actions">
        <div className="total-display"><div className="total-label">{t('checkout.total_amount')}</div><div className="total-amount">{formatPrice(tot.total)}</div></div>
        <button className="place-order-btn" disabled={!agree || processing} onClick={placeOrderNow}>{t('checkout.place_order')}</button>
      </div>

      {processing && (
        <div className="co-modal" id="coProcessing">
          <div className="modal-content">
            <div className="co-spinner" />
            <h3 className="processing-title">{t('checkout.processing_title')}</h3>
            <p className="processing-description">{t('checkout.processing_desc')}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="co-modal">
          <div className="modal-content">
            <div className="success-icon">{pending ? '⏳' : '✅'}</div>
            <h3 className="success-title">{pending ? t('checkout.pending_title') : t('checkout.success_title')}</h3>
            <p className="success-description">{pending ? t('checkout.pending_desc', { number: success.order.number }) : t('checkout.success_desc', { number: success.order.number })}</p>
            {success.result.simulated && <p className="processing-description" style={{ marginTop: 4 }}>{t('checkout.demo_note')}</p>}
            <div className="success-actions">
              <button className="track-order-btn" onClick={() => router.push(`/order/${success.order.id}`)}>{t('checkout.track_order')}</button>
              <button className="continue-shopping-btn" onClick={() => router.push('/')}>{t('action.continue_shopping')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
