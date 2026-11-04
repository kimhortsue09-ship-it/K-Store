'use client';
/** Transaction detail — faithful port: amount hero, status, metadata rows. Uses finance.css. */
import '../../../styles/pages/finance.css';
import '../../../styles/pages/extra.css';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTransactions, TX_META } from '@/lib/wallet';
import { formatPrice, formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';

const STATUS_CLASS: Record<string, string> = { completed: 'delivered', pending: 'pending', failed: 'cancelled' };

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { txs } = useTransactions();
  const tx = txs.find((t) => t.id === id);
  const copy = async (v: string) => { try { await navigator.clipboard.writeText(v); } catch { /* ignore */ } haptic('success'); toast('Copied', { kind: 'success' }); };
  const line = (label: string, value: string, copyBtn = false) => (
    <div className="detail-row"><span className="detail-label">{label}</span><span className="detail-value">{value}{copyBtn && <> <button className="text-accent semibold text-sm" onClick={() => copy(value)}>Copy</button></>}</span></div>
  );

  if (!tx) {
    return (
      <>
        <header className="page-header"><div className="header-top"><button className="hbtn" aria-label="Back" onClick={() => router.push('/transactions')}><Icon name="back" size={24} /></button><div className="htitle"><h1>Transaction</h1></div><span style={{ width: 40 }} /></div></header>
        <main className="screen"><div className="empty-state" style={{ paddingTop: 60 }}><div className="empty-state__emoji">🧐</div><h3>Transaction not found</h3><Link className="btn" href="/transactions">All transactions</Link></div></main>
      </>
    );
  }

  const meta = TX_META[tx.type];
  const inbound = tx.amount >= 0;
  const fee = tx.type === 'withdraw' ? Math.abs(tx.amount) * 0.01 : 0;
  const status = tx.status || 'completed';

  return (
    <>
      <header className="page-header"><div className="header-top"><button className="hbtn" aria-label="Back" onClick={() => router.push('/transactions')}><Icon name="back" size={24} /></button><div className="htitle"><h1>Transaction</h1></div><span style={{ width: 40 }} /></div></header>

      <main className="screen">
        <div className="tx-detail-hero">
          <div className="tx-icon">{meta.icon}</div>
          <div className={`tx-detail-amount ${inbound ? 'in' : ''}`}>{inbound ? '+' : '−'}{formatPrice(Math.abs(tx.amount))}</div>
          <div className="muted">{tx.title}</div>
          <div className="tx-detail-status"><span className={`status status--${STATUS_CLASS[status] || 'pending'}`}>{status}</span></div>
        </div>
        <div className="detail-card">
          {line('Type', meta.label)}
          {line('Date', formatDate(tx.date))}
          {line('Method', tx.method || '—')}
          {tx.counterparty && line('Counterparty', tx.counterparty)}
          {fee > 0 && line('Fee', formatPrice(fee))}
          {line('Reference', tx.reference || tx.id, true)}
          {line('Transaction ID', tx.id, true)}
        </div>
        <div className="container" style={{ marginTop: 16 }}><Link className="btn btn--outline btn--block" href="/support"><Icon name="help" size={18} /> Report a problem</Link></div>
      </main>
    </>
  );
}
