'use client';
/** Send / Transfer — faithful port: recipient + amount entry, records a transaction. Uses finance.css. */
import '../../styles/pages/finance.css';
import '../../styles/pages/extra.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { useTransactions } from '@/lib/wallet';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';

export default function SendPage() {
  const router = useRouter();
  const { balance, add } = useTransactions();
  const [to, setTo] = useState('');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');

  const send = () => {
    const recipient = to.trim();
    const val = parseFloat(amt);
    if (!recipient) { toast('Enter a recipient', { kind: 'danger' }); return; }
    if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); haptic('error'); return; }
    if (val > balance) { toast('Amount exceeds your balance', { kind: 'danger' }); haptic('error'); return; }
    const tx = add({ type: 'send', title: `To ${recipient}`, amount: -val, method: 'Wallet transfer', counterparty: recipient });
    haptic('success');
    toast(`Sent ${formatPrice(val)} to ${recipient}`, { kind: 'success' });
    setTimeout(() => router.push(`/transaction/${tx.id}`), 700);
  };

  return (
    <>
      <header className="page-header"><div className="header-top"><button className="hbtn" aria-label="Back" onClick={() => router.push('/wallet')}><Icon name="back" size={24} /></button><div className="htitle"><h1>Send</h1><span>Balance {formatPrice(balance)}</span></div><span style={{ width: 40 }} /></div></header>

      <main className="screen">
        <div className="container" style={{ paddingTop: 16 }}><div className="field"><label className="field__label">Send to</label><input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="@username or email" autoComplete="off" /></div></div>
        <div className="amount-entry">
          <div className="amount-entry__label">Amount</div>
          <div className="amount-input"><span className="amount-input__sym">{config.currency.symbol}</span><input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" placeholder="0" /></div>
          <div className="amount-avail">Available: {formatPrice(balance)}</div>
          <div className="quick-amounts">{[10, 25, 50].map((a) => <button key={a} className="chip" onClick={() => { setAmt(String(a)); haptic('selection'); }}>{formatPrice(a)}</button>)}<button className="chip" onClick={() => { setAmt(balance.toFixed(2)); haptic('selection'); }}>Max</button></div>
        </div>
        <div className="container"><div className="field"><label className="field__label">Note (optional)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" /></div></div>
      </main>

      <div className="bottom-bar"><button className="btn btn--block" onClick={send}>Send money</button></div>
    </>
  );
}
