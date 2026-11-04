'use client';
/**
 * Admin wallets — store credit overview + per-customer balances with credit/debit adjustments.
 * Mirrors admin/wallet.js: rows are buttons that open a "Manage wallet" sheet; applying an
 * adjustment updates the balance, prepends a ledger row, toasts and re-renders. In-memory demo.
 */
import { useState } from 'react';
import { DEMO_CUSTOMERS } from '@/lib/admin';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

interface WalletTx { label: string; amount: number; date: string }
interface Wallet { id: string; name: string; handle: string; balance: number; tx: WalletTx[] }

const SEED_BAL = [120, 0, 45, 15, 260];
const SEED_TX = [12, 0, 5, 3, 20];
const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function AdminWalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>(() =>
    DEMO_CUSTOMERS.map((c, i) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      balance: SEED_BAL[i % 5],
      tx: [{ label: 'Cashback', amount: SEED_TX[i % 5], date: '2024-06-30' }],
    })),
  );
  const [active, setActive] = useState<Wallet | null>(null);
  const [amt, setAmt] = useState('');
  const [reason, setReason] = useState('');

  const total = wallets.reduce((s, w) => s + w.balance, 0);
  const funded = wallets.filter((w) => w.balance > 0).length;

  const open = (w: Wallet) => { setActive(w); setAmt(''); setReason(''); haptic('selection'); };

  /** Credit adds, debit subtracts — the amount field always takes a positive number. */
  const apply = (direction: 1 | -1) => {
    if (!active) return;
    const value = Math.abs(parseFloat(amt));
    if (!value) { toast('Enter an amount', { kind: 'danger' }); haptic('error'); return; }
    const delta = value * direction;
    if (active.balance + delta < 0) { toast('Balance cannot go below zero', { kind: 'danger' }); haptic('error'); return; }
    const entry: WalletTx = { label: reason.trim() || 'Adjustment', amount: delta, date: new Date().toISOString().slice(0, 10) };
    setWallets((prev) => prev.map((w) => (w.id === active.id ? { ...w, balance: w.balance + delta, tx: [entry, ...w.tx] } : w)));
    haptic('success');
    toast(`${direction > 0 ? 'Credited' : 'Debited'} ${formatPrice(value)}`, { kind: 'success' });
    setActive(null);
  };

  return (
    <>
      <AdminHeader title="Wallets" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="card" size={18} /></span>Outstanding credit</span><span className="kpi__value">{formatPrice(total)}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="users" size={18} /></span>Funded wallets</span><span className="kpi__value">{funded}/{wallets.length}</span></div>
        </div>
        <div className="admin-section-title">Customer wallets</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {wallets.map((w) => (
            <button key={w.id} className="data-row" onClick={() => open(w)}>
              <span className="data-row__avatar">{initials(w.name)}</span>
              <span className="data-row__main"><span className="data-row__title">{w.name}</span><span className="data-row__sub">{w.handle}</span></span>
              <span className="data-row__end"><span className="semibold" style={{ color: w.balance ? 'var(--accent)' : 'var(--text-muted)' }}>{formatPrice(w.balance)}</span></span>
            </button>
          ))}
        </div>
      </main>
      <AdminTabBar active="customers" />

      {active && (
        <Sheet title="Manage wallet" onClose={() => setActive(null)}>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div><div className="semibold">{active.name}</div><div className="muted text-sm">{active.handle}</div></div>
            <div style={{ textAlign: 'right' }}><div className="muted text-sm">Balance</div><div className="semibold" style={{ fontSize: 20 }}>{formatPrice(active.balance)}</div></div>
          </div>
          <div className="field"><label className="field__label" htmlFor="wallet-amount">Amount</label><input id="wallet-amount" className="input" type="number" min={0} step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" /></div>
          <div className="field"><label className="field__label" htmlFor="wallet-reason">Reason</label><input id="wallet-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Goodwill credit, refund, correction…" /></div>
          <div className="row gap-2">
            <button className="btn" style={{ flex: 1 }} onClick={() => apply(1)}>Credit</button>
            <button className="btn btn--outline" style={{ flex: 1 }} onClick={() => apply(-1)}>Debit</button>
          </div>
          {active.tx.length > 0 && (
            <>
              <div className="admin-section-title" style={{ paddingInline: 0 }}>Recent</div>
              <div className="summary" style={{ padding: 0 }}>
                {active.tx.map((tr, i) => (
                  <div key={i} className="summary__row"><span>{tr.label} · {tr.date}</span><span style={{ color: tr.amount >= 0 ? 'var(--success)' : 'var(--text)' }}>{tr.amount >= 0 ? '+' : '−'}{formatPrice(Math.abs(tr.amount))}</span></div>
                ))}
              </div>
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
