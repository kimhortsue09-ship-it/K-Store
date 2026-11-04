'use client';
/**
 * Payment Methods — faithful port: default banner, saved-card rows, digital wallets
 * (connect/enable), and an add-card sheet. Demo-only card storage. Uses payment-methods.css.
 */
import '../../styles/pages/payment-methods.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { t } from '@/lib/i18n';
import { usePersistentState } from '@/lib/usePersistentState';
import { haptic, tgConfirm } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';

const NS = config.data.persistNamespace;
interface Card { id: string; brand: string; last4: string; exp: string; default: boolean }
type Wallets = { paypal: boolean; apple: boolean; google: boolean };

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [cards, setCards] = usePersistentState<Card[]>(`${NS}:cards`, []);
  const [wallets, setWallets] = usePersistentState<Wallets>(`${NS}:wallets`, { paypal: false, apple: false, google: false });
  const [adding, setAdding] = useState(false);
  const [num, setNum] = useState('');
  const [exp, setExp] = useState('');
  const [cname, setCname] = useState('');
  const [cdef, setCdef] = useState(true);
  const hasDefault = cards.some((c) => c.default);

  const setDefault = (id: string) => { setCards((cs) => cs.map((c) => ({ ...c, default: c.id === id }))); haptic('selection'); };
  const del = async (id: string) => { if (await tgConfirm(t('payment.remove_confirm'))) setCards((cs) => cs.filter((c) => c.id !== id)); };
  const toggleWallet = (id: keyof Wallets) => { setWallets((w) => ({ ...w, [id]: !w[id] })); haptic('success'); };
  const openAdd = () => { setNum(''); setExp(''); setCname(''); setCdef(cards.length === 0); setAdding(true); };
  const save = () => {
    const d = num.replace(/\s/g, '');
    if (d.length < 12 || !exp.trim()) { haptic('error'); return; }
    const brand = d.startsWith('4') ? 'Visa' : d.startsWith('5') ? 'Mastercard' : 'Card';
    setCards((cs) => [...(cdef ? cs.map((c) => ({ ...c, default: false })) : cs), { id: 'card-' + Date.now().toString(36), brand, last4: d.slice(-4), exp: exp.trim(), default: cdef || cs.length === 0 }]);
    haptic('success');
    setAdding(false);
  };

  const walletRows: [keyof Wallets, string, string, string, string, string][] = [
    ['paypal', '🅿️', 'PayPal', 'payment.connected', 'payment.not_connected', 'payment.connect'],
    ['apple', '', 'Apple Pay', 'payment.enabled', 'payment.available', 'payment.enable'],
    ['google', 'G', 'Google Pay', 'payment.enabled', 'payment.available', 'payment.enable'],
  ];

  return (
    <>
      <header className="payment-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('payment.title')}</h1><span className="payment-subtitle">{t('payment.subtitle')}</span></div>
        <button className="add-button" aria-label={t('payment.add')} onClick={openAdd}><Icon name="plus" size={24} /></button>
      </div></header>

      <main className="screen">
        <div className="payment-content">
          {cards.length > 0 && !hasDefault && (
            <div className="default-payment-banner"><div className="banner-icon">💳</div><div className="banner-text"><strong>{t('payment.set_default_banner')}</strong>{t('payment.set_default_banner_sub')}</div></div>
          )}
          {cards.length ? (
            <div className="payment-methods-list">
              {cards.map((c) => (
                <div key={c.id} className={`payment-method-card${c.default ? ' default' : ''}`}>
                  <div className="pm-brand">{c.brand === 'Visa' ? 'VISA' : c.brand === 'Mastercard' ? 'MC' : '💳'}</div>
                  <div className="pm-info"><div className="pm-number">{c.brand} •••• {c.last4}</div><div className="pm-meta">{t('payment.expires', { exp: c.exp })}</div></div>
                  <div className="pm-actions">
                    {c.default ? <span className="pm-default-badge">{t('payment.default_badge')}</span> : <button className="pm-action-btn" aria-label={t('payment.set_default')} onClick={() => setDefault(c.id)}><Icon name="check" size={16} /></button>}
                    <button className="pm-action-btn delete" aria-label={t('action.remove')} onClick={() => del(c.id)}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-payments"><div className="empty-icon">💳</div><h3 className="empty-title">{t('payment.empty')}</h3><p>{t('payment.empty_hint')}</p>
              <button className="add-payment-btn" onClick={openAdd}>{t('payment.add')}</button></div>
          )}

          <div className="digital-wallets-section">
            <h3 className="section-title">{t('payment.digital_wallets')}</h3>
            <div className="wallet-options">
              {walletRows.map(([id, emoji, nm, onL, offL, cta]) => {
                const on = wallets[id];
                return (
                  <div key={id} className="wallet-item">
                    <div className="wallet-icon">{emoji}</div>
                    <div className="wallet-info"><div className="wallet-name">{nm}</div><div className="wallet-status">{on ? t(onL) : t(offL)}</div></div>
                    <button className={`connect-btn ${on ? 'connected' : 'enabled'}`} onClick={() => toggleWallet(id)}>{on ? t('payment.connected') : t(cta)}</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {adding && (
        <Sheet title={t('payment.add')} onClose={() => setAdding(false)}>
          <div className="payment-type-tabs"><button className="payment-tab active">{t('payment.tab_card')}</button><button className="payment-tab">{t('payment.tab_bank')}</button></div>
          <div className="field"><label className="field__label" htmlFor="pm-num">{t('payment.card_number')}</label><input id="pm-num" className="input" inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} /></div>
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="pm-exp">{t('payment.expiry')}</label><input id="pm-exp" className="input" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM/YY" maxLength={5} /></div>
            <div className="field"><label className="field__label" htmlFor="pm-cvc">{t('payment.cvc')}</label><input id="pm-cvc" className="input" inputMode="numeric" placeholder="123" maxLength={4} /></div>
          </div>
          <div className="field"><label className="field__label" htmlFor="pm-name">{t('payment.name_on_card')}</label><input id="pm-name" className="input" value={cname} onChange={(e) => setCname(e.target.value)} placeholder={t('payment.name_ph')} /></div>
          <label className="checkbox-container" style={{ marginBottom: 16 }}><input type="checkbox" checked={cdef} onChange={(e) => setCdef(e.target.checked)} /><span className="checkmark" /><span className="checkbox-text">{t('payment.set_default_check')}</span></label>
          <button className="btn btn--block" onClick={save}>{t('payment.save_card')}</button>
        </Sheet>
      )}
    </>
  );
}
