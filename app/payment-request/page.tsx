'use client';
/** Payment Request — faithful port: amount + note → shareable pay link. Uses finance.css. */
import '../../styles/pages/finance.css';
import '../../styles/pages/extra.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { qr } from '@/lib/ui';
import { Icon } from '@/components/Icon';

export default function PaymentRequestPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ val: number; link: string } | null>(null);

  const gen = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); haptic('error'); return; }
    const ref = 'PR' + String(1000 + Math.floor(val)).slice(0, 6);
    setResult({ val, link: `https://pay.novastore.app/r/${ref}` });
    haptic('success');
  };
  const share = () => {
    if (!result) return;
    const text = `Please pay me ${formatPrice(result.val)} on ${config.brand.name}: ${result.link}`;
    if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ text }).catch(() => {});
    else { navigator.clipboard?.writeText(text); toast('Request copied to share', { kind: 'success' }); }
  };
  const copyLink = async (link: string) => {
    try { await navigator.clipboard.writeText(link); } catch { /* clipboard unavailable */ }
    toast('Link copied', { kind: 'success' });
  };

  return (
    <>
      <header className="page-header"><div className="header-top"><button className="hbtn" aria-label="Back" onClick={() => router.push('/wallet')}><Icon name="back" size={24} /></button><div className="htitle"><h1>{result ? 'Payment Request' : 'Request Payment'}</h1></div><span style={{ width: 40 }} /></div></header>

      <main className="screen">
        {!result ? (
          <>
            <div className="amount-entry">
              <div className="amount-entry__label">Amount to request</div>
              <div className="amount-input"><span className="amount-input__sym">{config.currency.symbol}</span><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" /></div>
            </div>
            <div className="container">
              <div className="field"><label className="field__label">Note (optional)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" /></div>
              <div className="quick-amounts">{[10, 25, 50, 100].map((a) => <button key={a} className="chip" onClick={() => { setAmount(String(a)); haptic('selection'); }}>{formatPrice(a)}</button>)}</div>
            </div>
          </>
        ) : (
          <>
            <div className="qr-card">
              <img src={qr(result.link)} alt="Payment QR code" />
              <div className="qr-amount">{formatPrice(result.val)}</div>
              {note && <div className="muted text-sm">{note}</div>}
              <div className="muted text-sm" style={{ marginTop: 8 }}>Scan to pay, or share the link below.</div>
            </div>
            <div className="pay-link"><span>{result.link}</span><button className="text-accent semibold text-sm" onClick={() => void copyLink(result.link)}>Copy</button></div>
          </>
        )}
      </main>

      <div className="bottom-bar">
        {!result ? (
          <button className="btn btn--block" onClick={gen}>Generate request</button>
        ) : (
          <>
            <button className="btn btn--outline" onClick={() => { setResult(null); setAmount(''); setNote(''); }}>New</button>
            <button className="btn grow" onClick={share}><Icon name="send" size={18} /> Share request</button>
          </>
        )}
      </div>
    </>
  );
}
