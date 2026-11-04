'use client';
/**
 * Admin support — faithful port of admin/support.js. Tickets live in the SHARED
 * `nova:tickets` localStorage key (the same store the customer Support page writes to), so
 * customer-created tickets show up here. List view → full-screen thread view with an agent
 * reply box and a Resolve/Reopen action in the app bar.
 */
import { useEffect, useState } from 'react';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

/** Shared ticket shape — identical to the customer Support page (`from: 'me'` = customer). */
interface Message { from: 'me' | 'them'; text: string; date: string }
interface Ticket { id: string; subject: string; status: 'open' | 'resolved'; date: string; messages: Message[] }

const KEY = `${config.data.persistNamespace}:tickets`;
const SEED: Ticket[] = [
  {
    id: 'tk-1001', subject: 'Where is my order NV-1002?', status: 'open', date: '2024-07-02T09:00:00Z',
    messages: [{ from: 'me', text: 'My order shows shipped but no tracking updates in 3 days.', date: '2024-07-02T09:00:00Z' }],
  },
];

export default function AdminSupportPage() {
  // `null` = key absent → seed once (matches the HTML `getTickets() || seed()`); `[]` stays empty.
  const [stored, setStored, ready] = usePersistentState<Ticket[] | null>(KEY, null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (ready && stored === null) setStored(SEED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const tickets = stored ?? [];
  const active = tickets.find((t) => t.id === openId) ?? null;

  const toggleStatus = () => {
    if (!active) return;
    setStored((prev) => (prev ?? []).map((t) => (t.id === active.id ? { ...t, status: t.status === 'open' ? 'resolved' : 'open' } : t)));
    haptic('success');
  };

  const send = () => {
    if (!active) return;
    const text = reply.trim();
    if (!text) return;
    const entry: Message = { from: 'them', text, date: new Date().toISOString() };
    setStored((prev) => (prev ?? []).map((t) => (t.id === active.id ? { ...t, messages: [...t.messages, entry] } : t)));
    setReply('');
    haptic('light');
    toast('Reply sent');
  };

  /* ---- Thread view (full screen, app bar retitled to the subject) ---- */
  if (active) {
    return (
      <>
        <header className="appbar admin-appbar">
          <button className="appbar__btn" aria-label="Back" onClick={() => { setOpenId(null); setReply(''); }}><Icon name="back" size={22} /></button>
          <h1 className="appbar__title">{active.subject}</h1>
          <div className="appbar__actions">
            {config.theme.allowUserToggle && <ThemeToggle />}
            <button className="appbar__btn" onClick={toggleStatus}>{active.status === 'open' ? 'Resolve' : 'Reopen'}</button>
          </div>
        </header>

        <main className="screen">
          <div className="thread" style={{ paddingBottom: 80 }}>
            {active.messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from === 'them' ? 'me' : 'them'}`}>
                {m.text}
                <span className="bubble__time">{m.from === 'them' ? 'You · ' : 'Customer · '}{formatDate(m.date)}</span>
              </div>
            ))}
          </div>
          <div className="thread-compose">
            <input
              aria-label="Reply to customer"
              className="input"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Reply to customer…"
              autoComplete="off"
            />
            <button className="btn" aria-label="Send" onClick={send}><Icon name="send" size={18} /></button>
          </div>
        </main>
        <AdminTabBar active="customers" />
      </>
    );
  }

  /* ---- List view ---- */
  const openCount = tickets.filter((t) => t.status === 'open').length;
  return (
    <>
      <AdminHeader title="Support" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="help" size={18} /></span>Open</span><span className="kpi__value">{openCount}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="check" size={18} /></span>Total</span><span className="kpi__value">{tickets.length}</span></div>
        </div>
        <div className="admin-section-title">Tickets</div>
        <div className="list" style={{ marginTop: 0 }}>
          {tickets.map((tk) => (
            <button key={tk.id} className="data-row" onClick={() => { setOpenId(tk.id); setReply(''); haptic('selection'); }}>
              <span className="data-row__avatar"><Icon name="help" size={18} /></span>
              <span className="data-row__main">
                <span className="data-row__title">{tk.subject}</span>
                <span className="data-row__sub">{tk.messages[tk.messages.length - 1]?.text}</span>
              </span>
              <span className={`status status--${tk.status === 'open' ? 'shipped' : 'delivered'}`}>{tk.status}</span>
            </button>
          ))}
        </div>
      </main>
      <AdminTabBar active="customers" />
    </>
  );
}
