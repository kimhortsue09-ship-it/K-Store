'use client';
/** Wallet — faithful port: balance card, quick actions, recent activity. Uses finance.css. */
import '../../styles/pages/finance.css';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { useTransactions, TX_META } from '@/lib/wallet';
import { formatPrice, formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';

const AMOUNTS = [25, 50, 100, 200];

export default function WalletPage() {
  const router = useRouter();
  const { txs, balance, add } = useTransactions();
  const recent = txs.slice(0, 5);
  const [topping, setTopping] = useState(false);
  const [amt, setAmt] = useState('');

  const topUp = () => {
    const val = parseFloat(amt);
    if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); return; }
    add({ type: 'topup', title: 'Top-up · Visa •••• 4242', amount: val, method: 'Visa •••• 4242' });
    haptic('success');
    setTopping(false);
    toast(`Added ${formatPrice(val)}`, { kind: 'success' });
    setAmt('');
  };

  const actions: { icon: string; label: string; href?: string; onClick?: () => void }[] = [
    { icon: 'plus', label: 'Top up', onClick: () => { setAmt(''); setTopping(true); } },
    { icon: 'send', label: 'Send', href: '/send' },
    { icon: 'download', label: 'Request', href: '/payment-request' },
    { icon: 'card', label: 'Withdraw', href: '/withdraw' },
  ];

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Wallet</h1></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="wallet-card"><small>Available balance</small><div className="wallet-balance">{formatPrice(balance)}</div></div>

        <div className="wallet-actions" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {actions.map((a) => {
            const body = <><span className="wallet-act__icon"><Icon name={a.icon} size={20} /></span><span>{a.label}</span></>;
            return a.href ? <Link key={a.label} className="wallet-act" href={a.href}>{body}</Link> : <button key={a.label} className="wallet-act" onClick={a.onClick}>{body}</button>;
          })}
        </div>

        <div className="section-head"><h2>Recent activity</h2><Link className="section-head__link" href="/transactions">See all</Link></div>
        <div className="tx-list" style={{ margin: '0 16px' }}>
          {recent.map((t) => {
            const m = TX_META[t.type];
            const inb = t.amount >= 0;
            return (
              <Link key={t.id} className="tx-row" href={`/transaction/${t.id}`}>
                <span className="tx-icon">{m.icon}</span>
                <span className="tx-body"><span className="tx-title">{t.title}</span><span className="tx-sub">{formatDate(t.date)}{t.status !== 'completed' ? ' · ' + t.status : ''}</span></span>
                <span className={`tx-amount ${inb ? 'in' : ''}`}>{inb ? '+' : '−'}{formatPrice(Math.abs(t.amount))}</span>
              </Link>
            );
          })}
        </div>
        <div style={{ height: 24 }} />
      </main>

      {topping && (
        <Sheet title="Top up wallet" onClose={() => setTopping(false)}>
          <div className="quick-amounts" style={{ justifyContent: 'flex-start' }}>{AMOUNTS.map((a) => <button key={a} className="chip" onClick={() => setAmt(String(a))}>{formatPrice(a)}</button>)}</div>
          <div className="field" style={{ marginTop: 16 }}><label className="field__label">Custom amount ({config.currency.symbol})</label><input className="input" value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" placeholder="0" /></div>
          <button className="btn btn--block" onClick={topUp}>Add funds</button>
        </Sheet>
      )}
    </>
  );
}
