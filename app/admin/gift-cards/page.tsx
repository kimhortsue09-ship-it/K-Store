'use client';
/** Admin gift cards — issued cards, issue new, void. Uses admin.css. */
import { useEffect, useState } from 'react';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatPrice, formatDate } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const NS = config.data.persistNamespace;
interface GC { code: string; amount: number; status: 'active' | 'redeemed' | 'void'; design: string; to: string; msg: string; date: string }
const STATUS: Record<string, string> = { active: 'delivered', redeemed: 'paid', void: 'cancelled' };
const SEED: GC[] = [
  { code: 'GIFT-7H2K-9QMP', amount: 100, status: 'active', design: '#00C853', to: '@amelia', msg: 'Happy birthday!', date: '2024-06-26T00:00:00Z' },
  { code: 'GIFT-3RTX-8LZ2', amount: 50, status: 'redeemed', design: '#5B6CFF', to: 'sam@mail.com', msg: '', date: '2024-06-19T00:00:00Z' },
  { code: 'GIFT-P4WD-2NBF', amount: 25, status: 'active', design: '#F59E0B', to: '', msg: '', date: '2024-06-12T00:00:00Z' },
];

export default function AdminGiftCardsPage() {
  const [cards, setCards, ready] = usePersistentState<GC[]>(`${NS}:giftcards`, []);
  useEffect(() => { if (ready && cards.length === 0) setCards(SEED); /* eslint-disable-next-line */ }, [ready]);
  const [filter, setFilter] = useState('all');
  const [issuing, setIssuing] = useState(false);
  const [amount, setAmount] = useState(50);
  const [to, setTo] = useState('');
  const [manage, setManage] = useState<GC | null>(null);

  const list = cards.filter((c) => filter === 'all' || c.status === filter);
  const active = cards.filter((c) => c.status === 'active');
  const outstanding = active.reduce((s, c) => s + c.amount, 0);
  const newCode = () => 'GIFT-' + Math.abs(Date.now() % 0xffffffff).toString(36).toUpperCase().padStart(8, 'X').slice(0, 8).replace(/(.{4})/, '$1-');
  const issue = () => { setCards((prev) => [{ code: newCode(), amount, status: 'active', design: '#00C853', to: to.trim(), msg: '', date: new Date().toISOString() }, ...prev]); haptic('success'); setIssuing(false); setTo(''); toast('Gift card issued', { kind: 'success' }); };
  const voidCard = async (code: string) => { setManage(null); if (await tgConfirm('Void this gift card? The balance becomes unusable.')) { setCards((prev) => prev.map((c) => (c.code === code ? { ...c, status: 'void' } : c))); haptic('success'); toast('Card voided'); } };

  return (
    <>
      <AdminHeader title="Gift cards" back="/admin" actions={<button className="appbar__btn" aria-label="Issue" onClick={() => { setAmount(50); setTo(''); setIssuing(true); }}><Icon name="plus" size={22} /></button>} />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="gift" size={18} /></span>Active cards</span><span className="kpi__value">{active.length}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="card" size={18} /></span>Outstanding</span><span className="kpi__value">{formatPrice(outstanding)}</span></div>
        </div>
        <div className="tabs-pill">{[['all', 'All'], ['active', 'Active'], ['redeemed', 'Redeemed'], ['void', 'Void']].map(([k, l]) => <button key={k} className={`chip${k === filter ? ' is-active' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {list.length ? list.map((c) => (
            <div key={c.code} role="button" tabIndex={0} className="data-row" onClick={() => setManage(c)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setManage(c); } }}>
              <span className="data-row__avatar" style={{ background: c.design || 'var(--accent-soft)', color: '#fff' }}>🎁</span>
              <span className="data-row__main"><span className="data-row__title">{c.code}</span><span className="data-row__sub">{c.to ? c.to + ' · ' : ''}{formatDate(c.date)}</span></span>
              <span className="data-row__end"><span className="semibold">{formatPrice(c.amount)}</span><span className={`status status--${STATUS[c.status]}`}>{c.status}</span></span>
            </div>
          )) : <p className="muted text-sm" style={{ padding: '0 16px' }}>No gift cards.</p>}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {issuing && (
        <Sheet title="Issue gift card" onClose={() => setIssuing(false)}>
          <div className="field"><label className="field__label">Amount</label><div className="chip-row" style={{ paddingInline: 0 }}>{[25, 50, 100, 200].map((a) => <button key={a} type="button" className={`chip${a === amount ? ' is-active' : ''}`} onClick={() => setAmount(a)}>{formatPrice(a)}</button>)}</div></div>
          <div className="field"><label className="field__label" htmlFor="gc-recipient">Recipient (optional)</label><input id="gc-recipient" className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="@username or email" /></div>
          <button className="btn btn--block" onClick={issue}>Issue gift card</button>
        </Sheet>
      )}
      {manage && (
        <Sheet title={manage.code} onClose={() => setManage(null)}>
          <div className="stack gap-3">
            <div className="row-between"><span className="muted text-sm">Amount</span><span className="semibold">{formatPrice(manage.amount)}</span></div>
            <div className="row-between"><span className="muted text-sm">Status</span><span className={`status status--${STATUS[manage.status]}`}>{manage.status}</span></div>
            {manage.msg && <div className="row-between"><span className="muted text-sm">Message</span><span>{manage.msg}</span></div>}
            <button className="btn btn--outline btn--block" onClick={() => { navigator.clipboard?.writeText(manage.code); toast('Code copied', { kind: 'success' }); }}><Icon name="card" size={18} /> Copy code</button>
            {manage.status === 'active' && <button className="btn btn--outline btn--block" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => voidCard(manage.code)}>Void card</button>}
          </div>
        </Sheet>
      )}
    </>
  );
}
