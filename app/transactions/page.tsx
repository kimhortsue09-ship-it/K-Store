'use client';
/** Transactions — faithful port: full history with All/Received/Spent filters. Uses finance.css. */
import '../../styles/pages/finance.css';
import '../../styles/pages/extra.css';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransactions, TX_META } from '@/lib/wallet';
import { formatPrice, formatDate } from '@/lib/format';
import { Icon } from '@/components/Icon';

export default function TransactionsPage() {
  const router = useRouter();
  const { txs } = useTransactions();
  const [filter, setFilter] = useState('all');
  const list = txs.filter((t) => (filter === 'all' ? true : filter === 'in' ? t.amount >= 0 : t.amount < 0));

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/wallet')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Transactions</h1><span>{list.length} entries</span></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="fin-content">
          <div className="chip-row" style={{ paddingInline: 0 }}>
            {[['all', 'All'], ['in', 'Received'], ['out', 'Spent']].map(([id, l]) => (
              <button key={id} className={`chip${filter === id ? ' is-active' : ''}`} onClick={() => setFilter(id)}>{l}</button>
            ))}
          </div>
          {list.length ? (
            <div className="tx-list">
              {list.map((t) => {
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
          ) : (
            <div className="empty-state"><div className="empty-state__emoji">🧾</div><h3>No transactions</h3></div>
          )}
        </div>
      </main>
    </>
  );
}
