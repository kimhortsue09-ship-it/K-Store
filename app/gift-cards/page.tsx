'use client';
/** Gift Cards — faithful port: Buy (amount + design + recipient → code + QR) / Redeem tabs. Uses features.css. */
import '../../styles/pages/features.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { qr } from '@/lib/ui';
import { useTransactions } from '@/lib/wallet';
import { Icon } from '@/components/Icon';

const NS = config.data.persistNamespace;
interface GiftCard { code: string; amount: number; status: 'active' | 'redeemed' | 'void'; design: string; to: string; msg: string; date: string }
const DESIGNS: [string, string][] = [
  ['linear-gradient(135deg,#00C853,#009e42)', '#00C853'],
  ['linear-gradient(135deg,#5B6CFF,#3B4BE0)', '#5B6CFF'],
  ['linear-gradient(135deg,#F0416C,#c62f3c)', '#F0416C'],
  ['linear-gradient(135deg,#F59E0B,#d97706)', '#F59E0B'],
];
const AMOUNTS = [25, 50, 100, 200];

export default function GiftCardsPage() {
  const router = useRouter();
  const [cards, setCards] = usePersistentState<GiftCard[]>(`${NS}:giftcards`, []);
  const { add: addTransaction } = useTransactions();
  const [tab, setTab] = useState<'buy' | 'redeem'>('buy');
  const [amount, setAmount] = useState(50);
  const [design, setDesign] = useState(0);
  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<GiftCard | null>(null);
  const [code, setCode] = useState('');

  const Preview = ({ amt }: { amt: number }) => (
    <div className="giftcard" style={{ background: DESIGNS[design][0] }}>
      <div className="giftcard__brand">{config.brand.logoEmoji} {config.brand.name} Gift Card</div>
      <div><div className="giftcard__amount">{formatPrice(amt)}</div></div>
      <div className="giftcard__foot"><span>Digital gift card</span><span>🎁</span></div>
    </div>
  );

  const genCode = () =>
    'GIFT-' +
    Math.abs([...(String(amount) + Date.now())].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))
      .toString(36)
      .toUpperCase()
      .slice(0, 8)
      .replace(/(.{4})/, '$1-');

  const buy = () => {
    const card: GiftCard = { code: genCode(), amount, status: 'active', design: DESIGNS[design][1], to: to.trim(), msg: msg.trim(), date: new Date().toISOString() };
    setCards((prev) => [card, ...prev]);
    haptic('success');
    setResult(card);
  };

  const copyCode = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard unavailable */ }
    toast('Code copied', { kind: 'success' });
  };

  const share = (card: GiftCard) => {
    const link = `https://gift.novastore.app/${card.code}`;
    const text = `You got a ${formatPrice(card.amount)} ${config.brand.name} gift card! Redeem code: ${card.code} — ${link}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      toast('Copied to share', { kind: 'success' });
    }
  };

  const redeem = () => {
    const key = code.trim().toUpperCase();
    const card = cards.find((c) => c.code === key && c.status === 'active');
    if (!key) { toast('Enter a code', { kind: 'danger' }); return; }
    if (!card) { toast('Invalid or already redeemed code', { kind: 'danger' }); haptic('error'); return; }
    setCards((prev) => prev.map((c) => (c.code === key ? { ...c, status: 'redeemed' } : c)));
    addTransaction({ type: 'receive', title: `Gift card ${card.code}`, amount: card.amount, method: 'Gift card' });
    haptic('success');
    toast(`${formatPrice(card.amount)} added to your wallet`, { kind: 'success' });
    setCode('');
    setTimeout(() => router.push('/wallet'), 800);
  };

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Gift Cards</h1></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        {result ? (
          <div className="feat-content" style={{ textAlign: 'center', paddingTop: 24 }}>
            <Preview amt={result.amount} />
            <div className="qr-card" style={{ margin: '16px 0' }}>
              <img src={qr(result.code)} alt="Gift QR" style={{ width: 160, height: 160, background: '#fff', borderRadius: 12, padding: 8 }} />
            </div>
            <div className="pay-link" style={{ margin: '0 0 16px' }}>
              <span>{result.code}</span>
              <button className="text-accent semibold text-sm" onClick={() => void copyCode(result.code)}>Copy</button>
            </div>
            <p className="muted text-sm">Send this code or QR to the lucky recipient.</p>
          </div>
        ) : (
          <div className="feat-content">
            <div className="seg-tabs">
              <button className={tab === 'buy' ? 'active' : ''} onClick={() => setTab('buy')}>Buy</button>
              <button className={tab === 'redeem' ? 'active' : ''} onClick={() => setTab('redeem')}>Redeem</button>
            </div>

            {tab === 'buy' ? (
              <>
                <Preview amt={amount} />
                <div className="gc-designs">{DESIGNS.map((d, i) => <span key={i} className={`gc-design${i === design ? ' on' : ''}`} style={{ background: d[0] }} onClick={() => setDesign(i)} />)}</div>
                <div className="field"><label className="field__label">Amount</label>
                  <div className="chip-row" style={{ paddingInline: 0 }}>{AMOUNTS.map((a) => <button key={a} className={`chip${a === amount ? ' is-active' : ''}`} onClick={() => setAmount(a)}>{formatPrice(a)}</button>)}</div></div>
                <div className="field"><label className="field__label">Recipient (optional)</label><input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="@username or email" /></div>
                <div className="field"><label className="field__label">Message (optional)</label><input className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Happy birthday!" /></div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 48 }}>🎁</div>
                  <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', marginTop: 8 }}>Redeem a gift card</h2>
                  <p className="muted">Add its balance straight to your wallet.</p>
                </div>
                <div className="field"><label className="field__label">Gift card code</label><input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="GIFT-XXXX-XXXX" autoComplete="off" /></div>
                <button className="btn btn--block" onClick={redeem}>Redeem to wallet</button>
              </>
            )}
          </div>
        )}
      </main>

      {result ? (
        <div className="bottom-bar">
          <button className="btn btn--outline" onClick={() => { setResult(null); setTo(''); setMsg(''); }}>New</button>
          <button className="btn grow" onClick={() => share(result)}><Icon name="send" size={18} /> Share</button>
        </div>
      ) : tab === 'buy' ? (
        <div className="bottom-bar">
          <button className="btn btn--block" onClick={buy}>Buy gift card · {formatPrice(amount)}</button>
        </div>
      ) : null}
    </>
  );
}
