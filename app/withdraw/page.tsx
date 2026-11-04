'use client';
/** Withdraw / Cash-out — faithful port: amount entry + destination, records a pending withdrawal. Uses finance.css. */
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

const DEST: [string, string][] = [['bank', '🏦 Bank ••6789'], ['card', '💳 Visa •••• 4242']];

export default function WithdrawPage() {
  const router = useRouter();
  const { balance, add } = useTransactions();
  const [amt, setAmt] = useState('');
  const [dest, setDest] = useState('bank');

  const submit = () => {
    const val = parseFloat(amt);
    if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); haptic('error'); return; }
    if (val > balance) { toast('Amount exceeds your balance', { kind: 'danger' }); haptic('error'); return; }
    const label = (DEST.find(([id]) => id === dest)?.[1] || '').replace(/^\S+\s/, '');
    const tx = add({ type: 'withdraw', title: `Withdraw to ${label}`, amount: -val, status: 'pending', method: label });
    haptic('success');
    toast('Withdrawal requested', { kind: 'success' });
    setTimeout(() => router.push(`/transaction/${tx.id}`), 700);
  };

  return (
    <>
      <header className="page-header"><div className="header-top"><button className="hbtn" aria-label="Back" onClick={() => router.push('/wallet')}><Icon name="back" size={24} /></button><div className="htitle"><h1>Withdraw</h1><span>Balance {formatPrice(balance)}</span></div><span style={{ width: 40 }} /></div></header>

      <main className="screen">
        <div className="amount-entry">
          <div className="amount-entry__label">Withdraw amount</div>
          <div className="amount-input"><span className="amount-input__sym">{config.currency.symbol}</span><input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" placeholder="0" /></div>
          <div className="amount-avail">Available: {formatPrice(balance)} · 1% fee</div>
          <div className="quick-amounts">{[25, 50].map((a) => <button key={a} className="chip" onClick={() => { setAmt(String(a)); haptic('selection'); }}>{formatPrice(a)}</button>)}<button className="chip" onClick={() => { setAmt(balance.toFixed(2)); haptic('selection'); }}>Max</button></div>
        </div>
        <div className="container">
          <div className="field"><label className="field__label">Destination</label>
            <div className="list" style={{ margin: 0 }}>
              {DEST.map(([id, l]) => (
                <label key={id} className="pick"><input type="radio" name="dest" value={id} checked={dest === id} onChange={() => setDest(id)} /><span className="pick__body"><span className="list-row__title">{l}</span></span></label>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="bottom-bar"><button className="btn btn--block" onClick={submit}>Withdraw</button></div>
    </>
  );
}
