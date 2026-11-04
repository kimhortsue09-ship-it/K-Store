'use client';
/** Returns & Refunds — faithful port: request list + a new-request sheet. Uses customer.css. */
import '../../styles/pages/customer.css';
import '../../styles/pages/extra.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';

const NS = config.data.persistNamespace;
const REASONS = ['Damaged or defective', 'Wrong item received', 'No longer needed', 'Better price found', 'Other'];
const STATUS_CLASS: Record<string, string> = { requested: 'pending', approved: 'shipped', refunded: 'delivered', rejected: 'cancelled' };
interface Ret { id: string; orderNumber: string; item: string; reason: string; note: string; status: string; date: string }

export default function ReturnsPage() {
  const router = useRouter();
  const { orders } = useStore();
  const [returns, setReturns] = usePersistentState<Ret[]>(`${NS}:returns`, []);
  const [adding, setAdding] = useState(false);
  const [itemIdx, setItemIdx] = useState('0');
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState('');
  const items = orders.filter((o) => ['delivered', 'shipped', 'paid'].includes(o.status)).flatMap((o) => o.items.map((it) => ({ order: o.number, name: it.name })));

  const open = () => { if (!items.length) { toast('No eligible orders to return', { kind: 'danger' }); return; } setItemIdx('0'); setReason(REASONS[0]); setNote(''); setAdding(true); };
  const submit = () => {
    const it = items[+itemIdx];
    if (!it) return;
    setReturns((prev) => [{ id: 'ret-' + Date.now().toString(36), orderNumber: it.order, item: it.name, reason, note, status: 'requested', date: new Date().toISOString() }, ...prev]);
    haptic('success');
    setAdding(false);
    toast('Return requested', { kind: 'success' });
  };

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Returns</h1><span>Requests &amp; refunds</span></div>
        <button className="hbtn" aria-label="New return" onClick={open}><Icon name="plus" size={24} /></button>
      </div></header>

      <main className="screen">
        {returns.length ? (
          <div className="list" style={{ marginTop: 16 }}>
            {returns.map((r) => (
              <div key={r.id} className="ticket-item">
                <span className="ticket-item__icon"><Icon name="box" size={18} /></span>
                <span className="ticket-item__body"><span className="ticket-item__title">{r.item}</span><span className="ticket-item__sub">Order {r.orderNumber} · {r.reason} · {formatDate(r.date)}</span></span>
                <span className={`status status--${STATUS_CLASS[r.status] || 'pending'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ paddingTop: 60 }}><div className="empty-state__emoji">📦</div><h3>No return requests</h3><p>Request a return or refund for a delivered order.</p><button className="btn" onClick={open}>Request a return</button></div>
        )}
      </main>

      {adding && (
        <Sheet title="Request a return" onClose={() => setAdding(false)}>
          <div className="field"><label className="field__label">Item</label><select className="input" value={itemIdx} onChange={(e) => setItemIdx(e.target.value)}>{items.map((it, i) => <option key={i} value={i}>{it.name} — {it.order}</option>)}</select></div>
          <div className="field"><label className="field__label">Reason</label><select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="field"><label className="field__label">Details (optional)</label><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us what happened" /></div>
          <button className="btn btn--block" onClick={submit}>Submit request</button>
        </Sheet>
      )}
    </>
  );
}
